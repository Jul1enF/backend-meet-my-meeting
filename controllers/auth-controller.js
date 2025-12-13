const User = require('../models/users')

const bcrypt = require('bcrypt')
const uid2 = require('uid2')
const jwt = require('jsonwebtoken')
const jwtTokenKey = process.env.JWT_TOKEN_KEY;


// SIGNIN
const signin = async (req, res, next) => {

    const { email, password } = req.body

    const userData = await User.findOne({ email })

    if (!userData || !bcrypt.compareSync(password, userData.password)) {
        res.json({ result: false, error: "Email ou mot de passe incorrect !" })
        return
    }
    else {
        const token = uid2(32)
        const newJwtToken = jwt.sign({
            token,
        }, jwtTokenKey)


        userData.token = token

        await userData.save()

        res.json({ result: true, user : {firstname: userData.firstname, name: userData.name, email: userData.email, jwtToken: newJwtToken, is_admin: userData.is_admin }})
    }
}

module.exports = { signin }