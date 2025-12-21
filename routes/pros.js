var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { ownerTokenAuth, adminTokenAuth, employeeTokenAuth } = require('../middlewares/token-auth.middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")

const { getAllUsers, updateUser, getAppointmentsTypes, appointmentTypesModification, deleteAppointmentType } = require("../controllers/pros-updates.controller")


// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
router.get("/get-all-users", ownerTokenAuth, errorHandler(getAllUsers), sendIfUpdated)

// UPDATE THE ROLE AND/OR THE SCHEDULE OF A USER
router.put("/update-user", ownerTokenAuth, errorHandler(updateUser))

// GET THE LIST OF ALL THE APPOINTMENT TYPES
router.get("/get-appointments-types", ownerTokenAuth, errorHandler(getAppointmentsTypes))

// CREATE OR UPDATE AN APPOINTMENT
router.put("/appointment-types-modification", ownerTokenAuth, errorHandler(appointmentTypesModification))

// DELETE AN APPOINTMENT TYPE
router.delete("/delete-appointment-type/:_id", ownerTokenAuth, errorHandler(deleteAppointmentType))

module.exports = router;