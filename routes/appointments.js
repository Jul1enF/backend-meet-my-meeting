var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { ownerTokenAuth, adminTokenAuth, employeeTokenAuth } = require('../middlewares/token-auth.middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")

const { appointmentInformations } = require("../controllers/appointments.controller")

// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
router.get("/appointment-informations", errorHandler(appointmentInformations), sendIfUpdated)

module.exports = router;