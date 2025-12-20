var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { ownerTokenAuth, adminTokenAuth, employeeTokenAuth } = require('../middlewares/token-auth-middleware')
const { sendIfUpdated } = require("../middlewares/send-if-updated-middleware")

const { getAllUsers, updateUser } = require("../controllers/pros-updates-controller")


// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
router.get("/get-all-users", ownerTokenAuth, errorHandler(getAllUsers), sendIfUpdated)

// UPDATE THE ROLE AND/OR THE SCHEDULE OF A USER
router.put("/update-user", ownerTokenAuth, errorHandler(updateUser))


module.exports = router;