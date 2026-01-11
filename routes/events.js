var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { ownerTokenAuth, adminTokenAuth, employeeTokenAuth } = require('../middlewares/token-auth.middleware')

const { scheduleInformations, eventRegistration, deleteEvent, modifyLunchBreak } = require('../controllers/events.controller')

const { sendIfUpdated } = require("../middlewares/send-if-updated.middleware")


// GET INFORMATIONS REQUIRED TO ESTABLISH THE DAYS SCHEDULE OF EMPLOYEES AND LET THEM REGISTER EVENTS
router.get("/schedule-informations", employeeTokenAuth, errorHandler(scheduleInformations), sendIfUpdated)

// SAVE A NEW EVENT
router.post("/event-registration", employeeTokenAuth, errorHandler(eventRegistration))

// DELETE AN EVENT
router.delete("/delete-event/:_id", employeeTokenAuth, errorHandler(deleteEvent))

// MODIFY THE LUNCH BREAK OF AN EMPLOYEE FOR A SPECIFIC DAY
router.put("/modify-lunch-break", employeeTokenAuth, errorHandler(modifyLunchBreak))



module.exports = router;