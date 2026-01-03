var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { ownerTokenAuth, adminTokenAuth, employeeTokenAuth, userTokenAuth } = require('../middlewares/token-auth.middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")

const { appointmentInformations, userAppointmentRegistration } = require("../controllers/appointments.controller")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
router.get("/appointment-informations", errorHandler(appointmentInformations), sendIfUpdated)

// SAVE A NEW APPOINTMENT
router.post("/user-appointment-registration", userTokenAuth, errorHandler(userAppointmentRegistration))

module.exports = router;