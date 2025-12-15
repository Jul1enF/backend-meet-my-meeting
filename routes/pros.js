var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { adminTokenAuth, coworkerTokenAuth } = require('../middlewares/token-auth-middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated-middleware")

const { getAllUsers } = require("../controllers/pros-updates-controller")


// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
router.get("/get-all-users", adminTokenAuth, errorHandler(getAllUsers), sendIfUpdated)



module.exports = router;