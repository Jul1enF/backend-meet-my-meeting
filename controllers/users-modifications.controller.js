const bcrypt = require('bcrypt')


// UPDATE USER INFORMATIONS
const updateUser = async (req, res, next) => {

    const { updatedUser, oldPassword, password } = req.body;

    let { user } = req;

    // Password comparison if an old one is provided

    if (oldPassword && !bcrypt.compareSync(oldPassword, user.password)) {
        res.json({ result: false, errorText: "Erreur : Ancien mot de passe incorrect !" })
        return
    }

    if (oldPassword && password) {
        const hash = bcrypt.hashSync(password, 10)
        user.password = hash
    }

    Object.assign(user, updatedUser)

    const userData = await user.save();
    const { first_name, last_name, email } = userData

    res.json({ result: true, userSaved : { first_name, last_name, email }, successText : "Modifications enregistrées avec succès !" })
}

module.exports = { updateUser }

