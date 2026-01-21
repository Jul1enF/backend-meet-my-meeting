const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")
const { DateTime } = require("luxon")

const getBlockingEvents = async (end, start, category, employee, excludeEventId = null) => {

    let blockingQuery = { start: { $lt: end }, end: { $gt: start } }

    // Exclude the current event if we are updating one
    if (excludeEventId) {
        blockingQuery._id = { $ne: excludeEventId }
    }

    if (category === "closure") {
        // if it is a closure event we check only appointments events (so that potentials registered breaks or absence doesn't block) but for every employees
        blockingQuery.category = "appointment"

    } else if (category === "absence") {
        // if it is an absence event we check only appointments relative to this employee
        blockingQuery.category = "appointment"
        blockingQuery.employee = employee
    } else {
        // for other events categories we search for everything that could block the employee (except suppressed default lunch break wich are events)

        // blocking categories
        blockingQuery.category = {
            $in: ["appointment", "break", "lunchBreak", "absence", "closure"]
        }

        // Either the employee is concerned by the event or it is a closure (that concern every employees)
        blockingQuery.$or = [
            { employee },
            { category: "closure" }
        ]

        // Don't take in consideration a suppressed lunch break, wich is just a marker
        blockingQuery.lunch_break_modification = { $ne: "suppression" }
    }
    const blockingEvents = await Event.find(blockingQuery)

    return blockingEvents
}


const isAppointmentTypeDeleted = async (_id) => {

    if (!_id) return false

    const selectedAppointmentType = await AppointmentType.findById(_id)

    if (!selectedAppointmentType || selectedAppointmentType.expiresAt) {
        return true
    } else {
        return false
    }
}


const isEmployeeStillWorking = async (appointmentEnd, employeeId) => {
    const employee = await User.findById(employeeId).select("contract_end").lean()

    if (!employee) return false

    if (!employee.contract_end) return true

    return new Date(employee.contract_end) > new Date(appointmentEnd)
}


const hasNewScheduleConflict = async ({ start, end, employee, lunchBreak }) => {

    // DATE QUERY
    // JS dates of the beginning and the end of the new schedule
    const jsStart = new Date(start)
    const jsEnd = new Date(end)

    // DateTime representing the start of the concerned day in Paris time
    const dtParisStartOfDay = DateTime.fromJSDate(jsStart, { zone: "Europe/Paris" }).startOf("day")

    // JS Dates of the beginning and end of the day in Paris time
    const jsParisStartOfDay = dtParisStartOfDay.toUTC().toJSDate()
    const jsParisEndOfDay = DateTime.fromJSDate(jsStart, { zone: "Europe/Paris" }).endOf("day").toUTC().toJSDate()

    // Search for events overlapping before or after the new schedule boundaries
    const dateQuery = {
        $or: [
            { start: { $lt: jsStart }, end: { $gt: jsParisStartOfDay } },
            { start: { $lt: jsParisEndOfDay }, end: { $gt: jsEnd } }
        ]
    }

    // Search for events overlapping the lunch break of the new schedule (if enabled)
    if (lunchBreak?.enabled) {
        const setSameDay = (dtA, dtB) => dtA.set({ year: dtB.year, month: dtB.month, day: dtB.day })

        const jsStartOfBreak = setSameDay(DateTime.fromFormat(lunchBreak.start, "HH:mm"), dtParisStartOfDay).toUTC().toJSDate()

        const jsEndOfBreak = setSameDay(DateTime.fromFormat(lunchBreak.end, "HH:mm"), dtParisStartOfDay).toUTC().toJSDate()

        dateQuery.$or.push(
            { start: { $lt: jsEndOfBreak }, end: { $gt: jsStartOfBreak } }
        )
    }


    // CATEGORY QUERY
    const categoryQuery = {
        category: { $in: ["appointment", "break", "lunchBreak"] }
    }


    // POTENTIAL UPDATED LUNCH BREAK QUERY
    const updatedLunchBreakQuery = {
        $or: [
            { lunch_break_modification: "update" },
            { lunch_break_modification: { $exists: false } }
        ]
    }

    // SEARCH OF BLOCKING EVENTS WITH THE QUERIES
    const blockingEvents = await Event.find({
        employee,
        ...categoryQuery,
        $and: [
            {
                ...updatedLunchBreakQuery
            },
            {
                ...dateQuery
            }
        ],
    })

    if (!blockingEvents.length) return false


    // REMOVE POTENTIAL NON-BLOCKING UPDATED LUNCHBREAK
    const blockingLunchBreak = blockingEvents.find(e => e.category === "lunchBreak")

    let cleanedBlockingEvents

    // If a lunch break fits within the new schedule, it doesn't matters if it overlaps the new default one
    const lunchBreakFitsSchedule =
        new Date(blockingLunchBreak?.start) >= jsStart &&
        new Date(blockingLunchBreak?.end) <= jsEnd

    if (blockingLunchBreak && lunchBreakFitsSchedule) {
        cleanedBlockingEvents = [...blockingEvents].filter(e => e._id.toString() !== blockingLunchBreak._id.toString())
    }
    else cleanedBlockingEvents = [...blockingEvents]

    return cleanedBlockingEvents.length > 0
}

module.exports = { getBlockingEvents, isAppointmentTypeDeleted, isEmployeeStillWorking, hasNewScheduleConflict }