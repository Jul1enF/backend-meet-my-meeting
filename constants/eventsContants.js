// Constants to use
const appointmentDefaultExpirationDate = 1000 * 60 * 60 * 24 * 30 * 1; // 1 months

const eventDefaultExpirationDate = 1000 * 60 * 60 * 24 * 30 * 6; // 6 months

const getAppointmentExpiration = () =>
  new Date(Date.now() + appointmentDefaultExpirationDate)

const getEventExpiration = () =>
  new Date(Date.now() + eventDefaultExpirationDate)

// Constants to send
const appointmentGapMs = 1000 * 60 * 15 // 15 minutes
const maxFuturDays = 15
const sortFreeEmployees = null
const rolesPriorities = { owner: 1, employee: 2 }
const defaultSchedule = { start: 9, end: 19 }

module.exports={ getAppointmentExpiration, getEventExpiration, appointmentGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities, defaultSchedule}