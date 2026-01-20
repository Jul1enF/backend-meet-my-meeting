const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")
const mongoose = require('mongoose');
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
        blockingQuery.$or = [
            { employee },
            { category: "closure" }
        ]
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


const hasWorkingOverrideConflict = async ({start, end, employee, lunchBreak, idToExclude}) => {
    const JsStart = new Date(start)
    const JsEnd = new Date(end)

    const parisStartOfDay = DateTime.fromJSDate(JsStart, { zone: "Europe/Paris" }).startOf("day")
    const JsParisStartOfDay = parisStartOfDay.toUTC().toJSDate()
    const JsParisEndOfDay = DateTime.fromJSDate(JsStart, { zone: "Europe/Paris" }).endOf("day").toUTC().toJSDate()

    const dateQuery = {
        $or: [
            { start: {$lt: JsStart }, end: { $gt: JsParisStartOfDay  } },
            { start: { $lt: JsParisEndOfDay }, end: { $gt: JsEnd  } }
        ]
    }

    if (lunchBreak?.enabled) {
        const setSameDay = (dtA, dtB) => dtA.set({ year: dtB.year, month: dtB.month, day: dtB.day })

        const JsStartOfBreak = setSameDay(DateTime.fromFormat(lunchBreak.start, "HH:mm"), parisStartOfDay).toUTC().toJSDate()

        const JsEndOfBreak = setSameDay(DateTime.fromFormat(lunchBreak.end, "HH:mm"), parisStartOfDay).toUTC().toJSDate()

        dateQuery.$or.push(
            { start: { $lt: JsEndOfBreak }, end: { $gt: JsStartOfBreak } }
        )
    }

    if (idToExclude){
        dateQuery._id = { $ne : new mongoose.Types.ObjectId(idToExclude)}
    }

    const blockingEvents = await Event.find({ category: "appointment", employee, ...dateQuery })

    return blockingEvents.length > 0
}

module.exports = { getBlockingEvents, isAppointmentTypeDeleted, isEmployeeStillWorking, hasWorkingOverrideConflict }