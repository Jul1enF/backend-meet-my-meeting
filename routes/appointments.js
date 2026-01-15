var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { userTokenAuth } = require('../middlewares/token-auth.middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")

const { appointmentInformations, appointmentRegistration, updateUserAppointment } = require("../controllers/appointments.controller")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
router.get("/appointment-informations", errorHandler(appointmentInformations), sendIfUpdated)

// USER CONNECTED : GET INFORMATIONS REQUIRED TO HAVE USER APPOINTMENTS AND ESTABLISH THE FREE SCHEDULE SLOT
router.get("/user-appointment-informations", userTokenAuth, errorHandler(appointmentInformations), sendIfUpdated)

// SAVE A NEW APPOINTMENT
router.post("/appointment-registration", userTokenAuth, errorHandler(appointmentRegistration))

// UPDATE A USER APPOINTMENT
router.put("/update-user-appointment", userTokenAuth, errorHandler())

module.exports = router;