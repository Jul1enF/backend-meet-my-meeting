const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

const { getAppointmentExpiration, getEventExpiration, slotGapMs, defaultSchedule } = require("../constants/documentConstants")

const { getBlockingEvents, isAppointmentTypeDeleted, isEmployeeStillWorking } = require('../utils/safetyChecks')
const { DateTime } = require("luxon");




// GET INFORMATIONS REQUIRED TO ESTABLISH THE DAYS SCHEDULE OF EMPLOYEES AND LET THEM REGISTER EVENTS
const scheduleInformations = async (req, res, next) => {

    // Employees, users and appointment types
    const employees = await User.find({
        role: { $in: ["owner", "employee"] }, $or: [
            { contract_end: { $exists: false } },
            { contract_end: null },
            { contract_end: { $gt: new Date() } }
        ]
    }).sort({ createdAt: 1 }).select('-password -token').lean()

    const appointmentTypes = await AppointmentType.find().lean()

    const users = await User.find({ role: { $eq: "client" } }).sort({ last_name: 1 }).select('-password -token').lean()

    // Events starting from the begining of the day (to display past event in the employee schedule)
    const dbEvents = await Event.find({ end: { $gt: DateTime.now({ zone: "Europe/Paris" }).startOf("day").toUTC().toJSDate() } })
        .sort({ start: 1 })
        .populate([
            { path: "appointment_type" },
            { path: "client" }
        ])
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
        } else if (e.category === "workingOverride") {
            workingOverrides.push(e)
            return
        }
        else events.push(e)
    })

    const constants = { slotGapMs, defaultSchedule }

    const informations = { employees, appointmentTypes, users, events, closures, absences, workingOverrides, constants }

    res.locals.searchResult = { dataName: "informations", data: informations }
    next();
}




// CREATE OR UPDATE AN EVENT
const createOrUpdate = async (req, res, next) => {
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

    // Safety check that it is not an employee posting an absence or break for another employee
    if (
        (isAbsence || category === "break")
        && user.role === "employee"
        && employee.toString() !== user._id.toString()
    ) {

        return res.json({ result: false, errorText: "Erreur : utilisateur non autorisé à poster cette absence" })
    }

    // Safety check that the selected employee is still working (his contract didn't end)
    if (employee) {
        const employeeStillWorking = await isEmployeeStillWorking(end, employee)
        if (!employeeStillWorking) {
            return res.json({ result: false, errorText: "Erreur : le professionel choisi ne travaille plus à cette date là" })
        }
    }

    // Safety check that meanwhile another event has not been registered for this time slot
    const blockingEvents = await getBlockingEvents(end, start, category, employee, isUpdate ? _id : null)

    const errorText = (isClosure || isAbsence) ? "Erreur : Un ou plusieurs RDV présent(s) dans ce créneau" : "Erreur : le créneau n'est plus disponible !"

    if (blockingEvents) {
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


    const successText = !isUpdate ? "Évènement enregistré !" : "Évènement modifié !"

    res.status(200).json({ result: true, successText, eventSaved })

}




// DELETE AN EVENT
const deleteEvent = async (req, res, next) => {
    const { _id } = req.params

    const data = await Event.deleteOne({ _id })

    if (data?.deletedCount === 1) res.json({ result: true, successText: "Évènement supprimé !" })
    else res.json({ result: false, errorText: "Erreur : Problème de connexion avec la base de donnée" })
}



module.exports = { scheduleInformations, createOrUpdate, deleteEvent }
