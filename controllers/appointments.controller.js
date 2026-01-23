const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

const { DateTime } = require('luxon')

const { appointmentExpiration, slotGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities } = require("../constants/documentConstants")

const { getBlockingEvents, isAppointmentTypeDeleted, isEmployeeStillWorking } = require("../utils/safetyChecks")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
const appointmentInformations = async (req, res, next) => {

  // Employees and appointment types
  const employees = await User.find({
    role: { $in: ["owner", "employee"] }, $or: [
      { contract_end: { $exists: false } },
      { contract_end: null },
      { contract_end: { $gt: new Date() } }
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
  const workingOverrides = []

  dbEvents.forEach(e => {
    if (e.category === "closure") {
      closures.push(e)
      return
    } else if (e.category === "absence") {
      absences.push(e)
      return
    }
    else if (e.category === "workingOverride") {
      workingOverrides.push(e)
      return
    }
    else events.push(e)
  })

  const constants = { slotGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities }

  const informations = { employees, appointmentTypes, events, closures, absences, workingOverrides, constants }

  res.locals.searchResult = { dataName: "informations", data: informations }
  next();
}





// CREATE OR UPDATE AN APPOINTMENT COMING FROM AN USER
const userAppointmentSaving = async (req, res, next) => {
  let { user } = req
  const { eventToSave } = req.body
  const { end, start, employee, category, appointment_type, client, _id } = eventToSave

  const isUpdate = Boolean(_id)


  // SAFETY CHECKS
  // Safety check that meanwhile another event has not been registered for this time slot
  const blockingEvents = await getBlockingEvents(end, start, category, employee, isUpdate ? _id : null)

  if (blockingEvents) {
    return res.json({ result: false, errorText: "Erreur : le créneau n'est plus disponible !" })
  }

  // Safety check that the user is updating an appointment for himself
  if (isUpdate && client.toString() !== user._id.toString()) {
    return res.json({ result: false, errorText: "Erreur : utilisateur modifiant un rdv ne lui appartenant pas !" })
  }

  // Safety check that the selected employee is still working (his contract didn"t end)
  const employeeStillWorking = await isEmployeeStillWorking(end, employee)
  if (!employeeStillWorking) {
    return res.json({ result: false, errorText: "Erreur : le professionel choisi ne travaille plus à cette date là" })
  }

  // Safety check that meanwhile the appointment type has not been suppressed (marked with an expiresAt)
  const appointmentTypeDeleted = await isAppointmentTypeDeleted(appointment_type)

  if (appointmentTypeDeleted) {
    return res.json({ result: false, errorText: "Erreur : Ce type de rdv vient d'être supprimé !", appointmentTypeError: true })
  }


  let eventSaved

  // CREATE
  if (!isUpdate) {
    const newEvent = new Event({
      ...eventToSave,
      client: user._id,
      createdBy: user._id,
      expiresAt: appointmentExpiration,
    })

    eventSaved = await newEvent.save()
  }
  // UPDATE
  else {
    eventSaved = await Event.findByIdAndUpdate(
      _id,
      { $set: eventToSave },
      { new: true, runValidators: true }
    )
  }

  await eventSaved.populate("appointment_type")

  res.status(200).json({ result: true, successText: "Rendez-vous enregistré !", eventSaved })

}



// USER DELETE AN APPOINTMENT
const deleteAppointment = async (req, res, next) => {
  const { _id } = req.params

  const data = await Event.deleteOne({ _id })

  if (data?.deletedCount === 1) res.json({ result: true, successText: "RDV supprimé !" })
  else res.json({ result: false, errorText: "Erreur : Problème de connexion avec la base de donnée" })
}



module.exports = { appointmentInformations, userAppointmentSaving, deleteAppointment }
