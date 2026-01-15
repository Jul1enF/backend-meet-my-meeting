const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

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

module.exports = { getBlockingEvents, isAppointmentTypeDeleted, isEmployeeStillWorking }