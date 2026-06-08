var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { requireAdmin } = require('../middlewares/token-auth.middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")

const { getAllUsers, updateUser, getAppointmentsTypes, appointmentTypesModification, deleteAppointmentType } = require("../controllers/pros-updates.controller")


// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
router.get("/get-all-users", requireAdmin, errorHandler(getAllUsers), sendIfUpdated)

// UPDATE THE ROLE AND/OR THE SCHEDULE OF A USER
router.put("/update-user", requireAdmin, errorHandler(updateUser))

// GET THE LIST OF ALL THE APPOINTMENT TYPES
router.get("/get-appointments-types", requireAdmin, errorHandler(getAppointmentsTypes))

// CREATE OR UPDATE AN APPOINTMENT TYPE
router.put("/appointment-types-modification", requireAdmin, errorHandler(appointmentTypesModification))

// DELETE AN APPOINTMENT TYPE (BY PUTING TO IT AN EXPIRATION DATE)
router.put("/delete-appointment-type", requireAdmin, errorHandler(deleteAppointmentType))

module.exports = router;