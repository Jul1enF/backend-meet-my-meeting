var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { userTokenAuth } = require('../middlewares/token-auth.middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")

const { appointmentInformations, userAppointmentSaving, deleteAppointment } = require("../controllers/appointments.controller")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE FREE SCHEDULE SLOT
router.get("/appointment-informations", errorHandler(appointmentInformations), sendIfUpdated)

// USER CONNECTED : GET INFORMATIONS REQUIRED TO HAVE USER APPOINTMENTS AND ESTABLISH THE FREE SCHEDULE SLOT
router.get("/user-appointment-informations", userTokenAuth, errorHandler(appointmentInformations), sendIfUpdated)

// CREATE OR UPDATE AN APPOINTMENT COMING FROM AN USER
router.put("/user-appointment-saving", userTokenAuth, errorHandler(userAppointmentSaving))

// USER DELETE AN APPOINTMENT
router.delete("/delete-appointment/:_id", userTokenAuth, errorHandler(deleteAppointment))

module.exports = router;