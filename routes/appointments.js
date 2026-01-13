var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { userTokenAuth } = require('../middlewares/token-auth.middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")

const { appointmentInformations, appointmentRegistration, userAppointments } = require("../controllers/appointments.controller")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
router.get("/appointment-informations", errorHandler(appointmentInformations), sendIfUpdated)

// SAVE A NEW APPOINTMENT
router.post("/appointment-registration", userTokenAuth, errorHandler(appointmentRegistration))

// GET ALL THE APPOINTMENT OF A USER
router.get("/user-appointments", userTokenAuth, errorHandler(userAppointments), sendIfUpdated)

module.exports = router;