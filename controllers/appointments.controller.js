const defaultExpirationDate = 1000 * 60 * 60 * 24 * 30 * 2; // 2 months
const expiresAt = new Date(Date.now() + defaultExpirationDate);
const appointmentGap = 1000 * 60 * 10 // 15 minutes
const maxFuturDays = 15

const Event = require("../models/events.model")
const EventType = require("../models/event-types.model")
const User = require("../models/users.model")

const moment = require('moment')



const appointmentInformations = async (req, res, next) => {
  const employees = await User.find({ role: { $ne: "client" } }).select('-password -token -email -last_name')
  const appointmentTypes = await EventType.find({ category: "appointment" })

  console.log("MAX DATE :", moment("23:59", "HH:mm").add(maxFuturDays, 'day'))

  const events = await Event.find({ start: { $lt: moment("23:59", "HH:mm").add(maxFuturDays, 'day') }, end: { $gt: moment() } }).populate("event_type")

  const informations = { employees, appointmentTypes, events }

  res.locals.searchResult = { dataName: "informations", data: informations }
  next();
}

module.exports = { appointmentInformations }


// // Recherche sur une plage de durée d'une semaine pour un employé
// Event.find({
//   employee: employeeId,
//   start: { $gte: weekStart, $lt: weekEnd }
// });

// // Recherche des rdv d'un client
// Event.find({
//   client: clientId,
//   start: { $gte: now }
// });