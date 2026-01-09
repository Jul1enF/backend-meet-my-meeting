const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

const { DateTime } = require('luxon')

const { defaultExpirationDate, expiresAt, appointmentGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities } = require("../constants/eventsContants")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
const appointmentInformations = async (req, res, next) => {

  // Employees and appointment types
  const employees = await User.find({ role: { $in: ["owner", "employee"] } }).sort({ createdAt: 1 }).select('-password -token -email -last_name -events').lean()
  const appointmentTypes = await AppointmentType.find().lean()

  // Events
  const now = DateTime.utc()
  const maxDate = now.plus({ days: maxFuturDays }).endOf("day").toJSDate()

  const dbEvents = await Event.find({ start: { $lt: maxDate }, end: { $gt: new Date() } })
    .sort({ start: 1 })
    .populate("appointment_type")
    .lean()

  const closures = []
  const absences = []
  const events = []

  dbEvents.forEach(e => {
    if (e.category === "closure") {
      closures.push(e)
      return
    } else if (e.category === "absence") {
      absences.push(e)
      return
    }
    else events.push(e)
  })

  const informations = { employees, appointmentTypes, events, closures, absences, appointmentGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities }

  res.locals.searchResult = { dataName: "informations", data: informations }
  next();
}


// SAVE A NEW APPOINTMENT
const appointmentRegistration = async (req, res, next) => {
  let { user } = req
  const { eventToSave } = req.body
  const { end, start, employee } = eventToSave

  // Safety check that meanwhile another event has not been registered for this hour
  const blockingEvents = await Event.find({ start: { $lt: end }, end: { $gt: start }, 
    $or: [
    { employee },
    { category: "closure" }
  ] })

  if (blockingEvents.length) {
    res.json({ result: false, errorText: "Erreur : le créneau n'est plus disponible !" })
  }
  else {
    const newEvent = new Event({
      ...eventToSave,
      client: user._id,
      createdBy: user._id,
      expiresAt,
    })

    const eventSaved = await newEvent.save()
    await eventSaved.populate("appointment_type")

    user.events.push(eventSaved._id)

    await user.save()

    res.status(200).json({ result: true, successText: "Rendez-vous enregistré !", eventSaved })
  }
}


module.exports = { appointmentInformations, appointmentRegistration  }
