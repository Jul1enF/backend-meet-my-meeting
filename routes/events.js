var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { ownerTokenAuth, adminTokenAuth, employeeTokenAuth } = require('../middlewares/token-auth.middleware')

const { eventRegistration } = require('../controllers/events.controller')


// SAVE A NEW EVENT
router.post("/event-registration", employeeTokenAuth, errorHandler(eventRegistration))


module.exports = router;