var express = require('express');
var router = express.Router();

const { errorHandler } = require('../utils/errorHandler')
const { userTokenAuth } = require('../middlewares/token-auth-middleware')

const { signin, signup } = require('../controllers/auth-controller')
const { updateUser } = require ('../controllers/users-modifications-controller')


// APP : CHECK THE MINIMUM VERSION REQUIRED
router.get('/getAppMinimumVersion', errorHandler((req, res, next)=> res.json({result : true, appMinimumVersion : "1.0.0"})))


// SIGNUP
router.post('/signup', errorHandler(signup))

// SIGNIN
router.post('/signin', errorHandler(signin));

// UPDATE USER
router.put('/update-user', userTokenAuth, errorHandler(updateUser))

module.exports = router;
