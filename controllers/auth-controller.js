const User = require('../models/users-model')

const bcrypt = require('bcrypt')
const uid2 = require('uid2')
const jwt = require('jsonwebtoken')
const jwtTokenKey = process.env.JWT_TOKEN_KEY;


// SIGNUP
const signup = async (req, res, next) => {
    const { first_name, last_name, email, password } = req.body

    // Check that the user is not already registered
    const data = await User.findOne({ email })
    if (data) {
        res.json({
            result: false,
            errorText: 'Utilisateur déjà enregistré !'
        })
        return
    }
    else {

        const hash = bcrypt.hashSync(password, 10)
        const token = uid2(32)

        const jwtToken = jwt.sign({
            token,
        }, jwtTokenKey)

        const newUser = new User({
            first_name,
            last_name,
            email,
            password: hash,
            token,
        })
        const data = await newUser.save()

        const user = {
            jwtToken,
            first_name,
            last_name,
            email,
            role : data.role,
            appointments: data.appointments,
        }

        res.json({ result: true, user })
    }
}


// SIGNIN
const signin = async (req, res, next) => {

    const { email, password } = req.body

    const userData = await User.findOne({ email })

    if (!userData || !bcrypt.compareSync(password, userData.password)) {
        res.json({ result: false, errorText: "Email ou mot de passe incorrect !" })
        return
    }
    else {
        const token = uid2(32)
        const newJwtToken = jwt.sign({
            token,
        }, jwtTokenKey)


        userData.token = token

        await userData.save()

        res.json({ result: true, user: { first_name: userData.first_name, last_name: userData.last_name, email: userData.email, jwtToken: newJwtToken, role : userData.role, appointments: userData.appointments } })
    }
}


module.exports = { signin, signup }