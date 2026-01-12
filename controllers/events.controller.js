const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

const { getAppointmentExpiration, getEventExpiration, appointmentGapMs, defaultSchedule } = require("../constants/eventsContants")

const { getBlockingEvents } = require('../utils/getBlockingEvents')




// GET INFORMATIONS REQUIRED TO ESTABLISH THE DAYS SCHEDULE OF EMPLOYEES AND LET THEM REGISTER EVENTS
const scheduleInformations = async (req, res, next) => {
   
    // Employees, users and appointment types
    const employees = await User.find({ role: { $in: ["owner", "employee"] } }).sort({ createdAt: 1 }).select('-password -token -events').lean()
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




// CREATE OR UPDATE AN EVENT
const createOrUpdate = async (req, res, next) => {
    let { user } = req // The employe saving the event

    const { eventToSave } = req.body
    const { end, start, employee, category, _id } = eventToSave

    const isAppointment = category === "appointment"
    const isClosure = category === "closure"
    const isAbsence = category === "absence"
    const isUpdate = Boolean(_id)

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


    let formattedEventToSave
    // Var to register the potential previous client id if it has changed
    let previousClientId

    // Create a new event
    if (!isUpdate) {
        const expiration = isAppointment ? { expiresAt: getAppointmentExpiration() } : { expiresAt: getEventExpiration() }

        formattedEventToSave = new Event({
            ...eventToSave,
            createdBy: user._id,
            ...expiration,
        })
    }
    // Update of an event
    else {
        formattedEventToSave = await Event.findById(_id)

        if (!formattedEventToSave) {
            return res.status(404).json({ result: false, errorText: "Erreur : Évènement introuvable en base de donnée" })
        }

        // Registration of a potential previous client id
        previousClientId = formattedEventToSave.client?.toString()

        Object.assign(formattedEventToSave, {
            ...eventToSave,
            updatedBy: user._id,
        })
    }

    const eventSaved = await formattedEventToSave.save()

    // The potential actual id of the client of the event
    const newClientId = eventSaved.client?.toString()

        await eventSaved.populate([
            { path: "appointment_type" },
            { path: "client" }
        ])

        if (previousClientId && previousClientId !== newClientId) {
            await User.findByIdAndUpdate(
                previousClientId,
                { $pull: { events: eventSaved._id } }
            )
        }
        if (newClientId && previousClientId !== newClientId) {
            await User.findByIdAndUpdate(
                newClientId,
                { $addToSet: { events: eventSaved._id } }
            )
        }


    const successText = !isUpdate ? "Évènement enregistré !" : category === "lunchBreak" ? "Pause déjeuner modifiée !" : "Évènement modifié !"

    res.status(200).json({ result: true, successText, eventSaved })

}




// DELETE AN EVENT
const deleteEvent = async (req, res, next) => {
    const { _id, clientId } = req.params
   
    // If there is an _id for a client affiliated to that event
    if (clientId){
        await User.findByIdAndUpdate(
            clientId,
            { $pull: { events: _id } }
        )
    }

    const data = await Event.deleteOne({ _id })

    if (data?.deletedCount === 1) res.json({ result: true, successText: "Évènement supprimé !" })
    else res.json({ result: false, errorText: "Erreur : Problème de connexion avec la base de donnée" })
}



module.exports = { scheduleInformations, createOrUpdate, deleteEvent }









// Function to clean events that were suppressed in db without suppressing them in the client events array
//  const allUsers = await User.find()
//     let suppressedEventCount = 0
//     let totalEventCount = 0
//     for (let user of allUsers){
//         const eventsToSuppress = []
//         if (user.events?.length){
//             totalEventCount += user.events.length
//             for (let event of user.events){
//                 const eventFound = await Event.findById(event)
//                 if (!eventFound){
//                     suppressedEventCount +=1
//                     eventsToSuppress.push(event.toString())
//                 }
//             }
//         }
//         user.events = [...user.events].filter(e => !eventsToSuppress.includes(e.toString()))
//         await user.save()
//     }
//     console.log("suppressedEventCount :", suppressedEventCount)
//     console.log("totalEventCount :", totalEventCount)