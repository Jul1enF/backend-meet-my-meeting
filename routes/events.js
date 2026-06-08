var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { requireEmployee } = require('../middlewares/token-auth.middleware')

const { scheduleInformations, createOrUpdate, deleteEvent, } = require('../controllers/events.controller')

const { workingOverrideSaving, deleteWorkingOverride } = require("../controllers/working-override.controller")

const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE DAYS SCHEDULE OF EMPLOYEES AND LET THEM REGISTER EVENTS
router.get("/schedule-informations", requireEmployee, errorHandler(scheduleInformations), sendIfUpdated)

// CREATE OR UPDATE AN EVENT
router.put("/create-or-update", requireEmployee, errorHandler(createOrUpdate))

// DELETE AN EVENT
router.delete("/delete-event/:_id", requireEmployee, errorHandler(deleteEvent))

// CREATE OR UPDATE A WORKING OVERRIDE
router.put("/working-override-saving", requireEmployee, errorHandler(workingOverrideSaving))

// DELETE A WORKING OVERRIDE
router.delete("/delete-working-override/:eventId/:employeeId", requireEmployee, errorHandler(deleteWorkingOverride))

module.exports = router;