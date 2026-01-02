const defaultExpirationDate = 1000 * 60 * 60 * 24 * 30 * 2; // 2 months
const expiresAt = new Date(Date.now() + defaultExpirationDate);
const appointmentGapMs = 1000 * 60 * 15 // 15 minutes
const maxFuturDays = 15
const sortFreeEmployees = null
const rolesPriorities = { owner: 1, admin: 2, employee: 3 }

const Event = require("../models/events.model")
const AppointmentType = require("../models/appointment-types.model")
const User = require("../models/users.model")

const { DateTime } = require('luxon')


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
const appointmentInformations = async (req, res, next) => {

  // Employees and appointment types
  const employees = await User.find({ role: { $ne: "client" } }).sort({ createdAt: 1 }).select('-password -token -email -last_name -events')
  const appointmentTypes = await AppointmentType.find()

  // Events
  const now = DateTime.utc()
  const maxDate = now.plus({ days: maxFuturDays }).endOf("day").toJSDate()

  const dbEvents = await Event.find({ start: { $lt: maxDate }, end: { $gt: new Date() } })
    .sort({ start: 1 })
    .populate("appointment_type")

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

module.exports = { appointmentInformations }
