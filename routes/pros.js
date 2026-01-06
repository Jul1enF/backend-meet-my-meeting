var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { ownerTokenAuth, adminTokenAuth, employeeTokenAuth } = require('../middlewares/token-auth.middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")

const { getAllUsers, updateUser, getAppointmentsTypes, appointmentTypesModification, deleteAppointmentType } = require("../controllers/pros-updates.controller")
const { scheduleInformations } = require("../controllers/appointments.controller")


// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
router.get("/get-all-users", adminTokenAuth, errorHandler(getAllUsers), sendIfUpdated)

// UPDATE THE ROLE AND/OR THE SCHEDULE OF A USER
router.put("/update-user", adminTokenAuth, errorHandler(updateUser))

// GET THE LIST OF ALL THE APPOINTMENT TYPES
router.get("/get-appointments-types", adminTokenAuth, errorHandler(getAppointmentsTypes))

// CREATE OR UPDATE AN APPOINTMENT
router.put("/appointment-types-modification", adminTokenAuth, errorHandler(appointmentTypesModification))

// DELETE AN APPOINTMENT TYPE
router.delete("/delete-appointment-type/:_id", adminTokenAuth, errorHandler(deleteAppointmentType))

// GET INFORMATIONS REQUIRED TO ESTABLISH THE DAYS SCHEDULE OF EMPLOYEES AND LET THEM BOOK APPOINTMENTS
router.get("/schedule-informations", employeeTokenAuth, errorHandler(scheduleInformations), sendIfUpdated)

module.exports = router;