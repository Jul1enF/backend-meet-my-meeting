const Event = require("../models/events.model")

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
        blockingQuery.$or = [
            { employee },
            { category: "closure" }
        ]
    }
    const blockingEvents = await Event.find(blockingQuery)

    return blockingEvents
}

module.exports = { getBlockingEvents }