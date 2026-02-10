const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")
const { jsDateFromStringTime, getJsParisStartOfDay, getJsParisEndOfDay } = require("../utils/timeFunctions")
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
        // for other events categories we search for everything that could block the employee

        // Either the employee is concerned by the event or it is a closure (that concern every employees)
        blockingQuery.$or = [
            {
                employee,
                category: { $in: ["appointment", "break", "absence"] }
            },
            {
                category: "closure"
            }
        ]

    }
    return await Event.exists(blockingQuery)
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

    // DateTime representing the concerned day in Paris time
    const parisDtDay = DateTime.fromJSDate(jsStart, { zone: "Europe/Paris" })

    // JS Dates of the beginning and end of the day in Paris time
    const jsParisStartOfDay = getJsParisStartOfDay(jsStart)
    const jsParisEndOfDay = getJsParisEndOfDay(jsStart)

    // Search for events overlapping before or after the new schedule boundaries
    const dateQuery = {
        $or: [
            { start: { $lt: jsStart }, end: { $gt: jsParisStartOfDay } },
            { start: { $lt: jsParisEndOfDay }, end: { $gt: jsEnd } }
        ]
    }

    // Search for events overlapping the lunch break of the new schedule (if enabled)
    if (lunchBreak?.enabled) {

        const jsStartOfBreak = jsDateFromStringTime(lunchBreak.start, parisDtDay)

        const jsEndOfBreak = jsDateFromStringTime(lunchBreak.end, parisDtDay)

        dateQuery.$or.push(
            { start: { $lt: jsEndOfBreak }, end: { $gt: jsStartOfBreak } }
        )
    }


    // CATEGORY QUERY
    // In the front, it's impossible to create/update/delete a workingOverride if there is already on this day a closure or an absence. So we don't look for them.
    const categoryQuery = {
        category: { $in: ["appointment", "break"] }
    }


    // SEARCH OF BLOCKING EVENTS WITH THE QUERIES
    return await Event.exists({
        employee,
        ...categoryQuery,
        ...dateQuery
    })
}



const hasEmployeeDayAppointments = async (dtDay, employee) => {

    const jsParisStartOfDay = getJsParisStartOfDay(dtDay)
    const jsParisEndOfDay = getJsParisEndOfDay(dtDay)

    return await Event.exists({
        employee,
        category: "appointment",
        start: { $lt: jsParisEndOfDay },
        end:   { $gt: jsParisStartOfDay },
    })
}



const hasAppointmentsAfterSelectedDate = async (employeeId, date) => {
    return await Event.exists({
        employee : employeeId,
        category: "appointment",
        start: { $gte: date },
    })
}



module.exports = { getBlockingEvents, isAppointmentTypeDeleted, isEmployeeStillWorking, hasNewScheduleConflict, hasEmployeeDayAppointments, hasAppointmentsAfterSelectedDate }