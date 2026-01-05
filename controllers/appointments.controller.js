const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

const { DateTime } = require('luxon')

// Constants to send
const defaultExpirationDate = 1000 * 60 * 60 * 24 * 30 * 2; // 2 months
const expiresAt = new Date(Date.now() + defaultExpirationDate);
const appointmentGapMs = 1000 * 60 * 15 // 15 minutes
const maxFuturDays = 15
const sortFreeEmployees = null
const rolesPriorities = { owner: 1, admin: 2, employee: 3 }
const defaultSchedule = { start : 8, end : 19}


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
const appointmentInformations = async (req, res, next) => {

  // Employees and appointment types
  const employees = await User.find({ role: { $ne: "client" } }).sort({ createdAt: 1 }).select('-password -token -email -last_name -events').lean()
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

  const informations = { employees, appointmentTypes, events, closures, absences, appointmentGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities, defaultSchedule }

  res.locals.searchResult = { dataName: "informations", data: informations }
  next();
}


// SAVE A NEW APPOINTMENT
const userAppointmentRegistration = async (req, res, next) => {
  let { user } = req
  const { appointmentToSave } = req.body
  const { end, start, employee } = appointmentToSave

  // Safety check that meanwhile another event has not been registered for this hour
  const blockingEvent = await Event.find({ start: { $lt: end }, end: { $gt: start }, employee })

  if (blockingEvent.length) {
    res.json({ result: false, errorText: "Erreur : le créneau n'est plus disponible !" })
  }
  else {
    const newAppointment = new Event({
      ...appointmentToSave,
      client: user._id,
      createdBy: user._id,
      expiresAt,
    })

    const appointmentSaved = await newAppointment.save()
    await appointmentSaved.populate("appointment_type")

    user.events.push(appointmentSaved._id)

    await user.save()

    res.status(200).json({ result: true, successText: "Rendez-vous enregistré !", appointmentSaved })
  }
}



// GET INFORMATIONS REQUIRED TO ESTABLISH THE DAYS SCHEDULE OF EMPLOYEES AND LET THEM BOOK APPOINTMENTS
const scheduleInformations = async (req, res, next) => {

  // Employees, users and appointment types
  const employees = await User.find({ role: { $ne: "client" } }).sort({ createdAt: 1 }).select('-password -token -events').lean()
  const appointmentTypes = await AppointmentType.find().lean()
  const users = await User.find({ role: { $eq: "client" } }).sort({ last_name: 1 }).select('-password -token -events').lean()

  // Events
  const dbEvents = await Event.find({ end: { $gt: new Date() } })
    .sort({ start: 1 })
    .populate([
      { path: "appointment_type" },
      { path: "client" }
    ])
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

  const informations = { employees, appointmentTypes, users, events, closures, absences, appointmentGapMs, defaultSchedule }

  res.locals.searchResult = { dataName: "informations", data: informations }
  next();
}

module.exports = { appointmentInformations, userAppointmentRegistration, scheduleInformations }
