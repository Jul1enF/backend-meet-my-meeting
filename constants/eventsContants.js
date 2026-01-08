// Constants to use
const defaultExpirationDate = 1000 * 60 * 60 * 24 * 30 * 2; // 2 months
const expiresAt = new Date(Date.now() + defaultExpirationDate);

// Constants to send
const appointmentGapMs = 1000 * 60 * 15 // 15 minutes
const maxFuturDays = 15
const sortFreeEmployees = null
const rolesPriorities = { owner: 1, employee: 2 }
const defaultSchedule = { start: 8, end: 19 }

module.exports={ defaultExpirationDate, expiresAt, appointmentGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities, defaultSchedule}