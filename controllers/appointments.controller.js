const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

const { DateTime } = require('luxon')

const { appointmentExpiration, appointmentGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities } = require("../constants/documentConstants")

const { getBlockingEvents, isAppointmentTypeDeleted } = require("../utils/safetyChecks")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
const appointmentInformations = async (req, res, next) => {

  // Employees and appointment types
  const employees = await User.find({
    role: { $in: ["owner", "employee"] }, $or: [
      { contract_end: { $exists: false } },
      { contract_end: null },
      { contract_end: { $gt: now } }
    ]
  }).sort({ createdAt: 1 }).select('-password -token -email -last_name').lean()
  const appointmentTypes = await AppointmentType.find({ expiresAt: { $exists: false } }).lean()

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
  const { end, start, employee, category, appointment_type } = eventToSave

  // Safety check that meanwhile another event has not been registered for this time slot
  const blockingEvents = await getBlockingEvents(end, start, category, employee)

  if (blockingEvents.length) {
    return res.json({ result: false, errorText: "Erreur : le créneau n'est plus disponible !" })
  }

  // Safety check that meanwhile the appointment type has not been suppressed (marked with an expiresAt)
  const appointmentTypeDeleted = await isAppointmentTypeDeleted(appointment_type)

  if (appointmentTypeDeleted) {
    return res.json({ result: false, errorText: "Erreur : Ce type de rdv vient d'être supprimé !", appointmentTypeError: true })
  }

  const newEvent = new Event({
    ...eventToSave,
    client: user._id,
    createdBy: user._id,
    expiresAt: appointmentExpiration,
  })

  const eventSaved = await newEvent.save()
  await eventSaved.populate("appointment_type")

  res.status(200).json({ result: true, successText: "Rendez-vous enregistré !", eventSaved })

}



// UPDATE A USER APPOINTMENT
const updateUserAppointment = async (req, res, next) => {
    let { user } = req // The employe saving the event

    const { eventToSave } = req.body
    const { end, start, employee, category, _id, appointment_type } = eventToSave

    const isAppointment = category === "appointment"
    const isClosure = category === "closure"
    const isAbsence = category === "absence"
    const isUpdate = Boolean(_id)

    // SAFETY CHECKS
    // Safety check that it is not an employee posting a closure event
    if (isClosure && user.role === "employee") {
        return res.json({ result: false, errorText: "Erreur : utilisateur non autorisé à poster une fermeture" })
    }

    // Safety check that it is not an employee posting an absence, break or LunchBreak for another employee
    if (
        (isAbsence || category === "break" || category === "lunchBreak")
        && user.role === "employee"
        && employee.toString() !== user._id.toString()
    ) {

        return res.json({ result: false, errorText: "Erreur : utilisateur non autorisé à poster cette absence" })
    }

    // Safety check that meanwhile another event has not been registered for this time slot
    const blockingEvents = await getBlockingEvents(end, start, category, employee, isUpdate ? _id : null)

    const errorText = (isClosure || isAbsence) ? "Erreur : Un ou plusieurs RDV présent(s) dans ce créneau" : "Erreur : le créneau n'est plus disponible !"

    if (blockingEvents.length) {
        return res.json({ result: false, errorText })
    }

    // Safety check that meanwhile the appointment type has not been suppressed (marked with an expiresAt)
    const appointmentTypeDeleted = await isAppointmentTypeDeleted(appointment_type)

    if (appointmentTypeDeleted) {
        return res.json({ result: false, errorText: "Erreur : Ce type de rdv vient d'être supprimé !", appointmentTypeError: true })
    }


    // Futur doc to save
    let formattedEventToSave

    // CREATE
    if (!isUpdate) {
        const expiration = isAppointment ? { expiresAt: getAppointmentExpiration() } : { expiresAt: getEventExpiration() }

        formattedEventToSave = new Event({
            ...eventToSave,
            createdBy: user._id,
            ...expiration,
        })
    }
    // UPDATE
    else {
        formattedEventToSave = await Event.findById(_id)

        if (!formattedEventToSave) {
            return res.status(404).json({ result: false, errorText: "Erreur : Évènement introuvable en base de donnée" })
        }

        Object.assign(formattedEventToSave, {
            ...eventToSave,
            updatedBy: user._id,
        })
    }

    // SAVE
    const eventSaved = await formattedEventToSave.save()

    await eventSaved.populate([
        { path: "appointment_type" },
        { path: "client" }
    ])


    const successText = !isUpdate ? "Évènement enregistré !" : category === "lunchBreak" ? "Pause déjeuner modifiée !" : "Évènement modifié !"

    res.status(200).json({ result: true, successText, eventSaved })

}



module.exports = { appointmentInformations, appointmentRegistration, updateUserAppointment }
