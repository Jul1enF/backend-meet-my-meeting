const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

const { defaultExpirationDate, expiresAt, appointmentGapMs, defaultSchedule } = require("../constants/eventsContants")


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



// SAVE A NEW EVENT
const eventRegistration = async (req, res, next) => {
    let { user } = req // The employe saving the event

    const { eventToSave } = req.body
    const { end, start, employee, category, client } = eventToSave

    const closure = category === "closure"
    const absence = category === "absence"

    // Safety check that it is not an employee posting a closure event
    if (closure && user.role === "employee") {
        res.json({ result: false, errorText: "Erreur : utilisateur non autorisé à poster une fermeture" })
    }

    // Safety check that it is not an employee posting an absence or break for another employee
    if ((category === "absence" || category === "break" || category === "lunchBreak")
        && user.role === "employee"
        && employee.toString() !== user._id.toString()) {

        res.json({ result: false, errorText: "Erreur : utilisateur non autorisé à poster ce congé" })
    }


    // Safety check that meanwhile another event has not been registered for this time slot
    let blockingQuery = { start: { $lt: end }, end: { $gt: start } }

    if (closure) {
        // if it is a closure event we check only appointments events (so that potentials registered breaks or absence doesn't block) but for every employees
        blockingQuery.category = "appointment"

    } else if (absence) {
        // if it is an absence event we check only appointments relative to this employee
        blockingQuery.category = "appointment"
        blockingQuery.employee = employee
    } else {
        // for other events categories we search for everything that could block the employee
        blockingQuery.$or = [
            { employee },
            { category: "closure" }
        ]
    }
    const blockingEvents = await Event.find(blockingQuery)


    const errorText = (closure || absence) ? "Erreur : Un ou plusieurs RDV présent(s) dans ce créneau" : "Erreur : le créneau n'est plus disponible !"

    if (blockingEvents.length) {
        res.json({ result: false, errorText })
    }
    else {
        const expiration = category === "appointment" ? { expiresAt } : {}

        // If it is a closure event we supress the field employee because it is for all the employees
        closure && delete eventToSave.employee

        const newEvent = new Event({
            ...eventToSave,
            createdBy: user._id,
            ...expiration,
        })
        console.log("newEvent :", newEvent)

        const eventSaved = await newEvent.save()
        await eventSaved.populate([
            { path: "appointment_type" },
            { path: "client" }
        ])

        if (category === "appointment" && client?._id) {
            await User.findByIdAndUpdate(
                client._id,
                { $addToSet: { events: eventSaved._id } }
            )
        }

        res.status(200).json({ result: true, successText: "Évènement enregistré !", eventSaved })
    }
}


module.exports = { scheduleInformations, eventRegistration }