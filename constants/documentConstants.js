// Constant to use and send
const maxFuturDays = 15


// Constants to use
const appointmentDefaultExpirationTime = 1000 * 60 * 60 * 24 * 30 * 1; // 1 months
const eventDefaultExpirationTime = 1000 * 60 * 60 * 24 * 30 * 6; // 6 months
const appointmentTypeDefaultExpirationTime = 1000 * 60 * 60 * 24 * maxFuturDays * 2

const getAppointmentExpiration = () =>
  new Date(Date.now() + appointmentDefaultExpirationTime)

const getEventExpiration = () =>
  new Date(Date.now() + eventDefaultExpirationTime)

const getAppointmentTypeExpiration = () =>
  new Date(Date.now() + appointmentTypeDefaultExpirationTime)


// Constants to send
const slotGapMs = 1000 * 60 * 15 // 15 minutes
const sortFreeEmployees = null   // null | "role" | "msOfWork" | "eventCount" | "createdAt"
const rolesPriorities = { owner: 1, employee: 2 }

const defaultSchedule = {
  enabled: true,
  start: "09:00",
  end: "18:00",
  break: {
    enabled: true,
    start: "13:00",
    end: "14:00",
  }
}

module.exports = { getAppointmentExpiration, getEventExpiration, getAppointmentTypeExpiration, slotGapMs, maxFuturDays, sortFreeEmployees, rolesPriorities, defaultSchedule }