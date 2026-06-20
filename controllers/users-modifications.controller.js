const bcrypt = require('bcrypt')
const User = require('../models/users.model')
const Event = require("../models/events.model")
const { hasAppointmentsAfterSelectedDate } = require("../utils/safetyChecks")


// UPDATE USER INFORMATIONS
const updateUser = async (req, res, next) => {

    const { updatedUser, oldPassword, password } = req.body;

    let { user } = req;

    // Password comparison if an old one is provided

    if (oldPassword && !bcrypt.compareSync(oldPassword, user.password)) {
        res.json({ result: false, errorText: "Erreur : Ancien mot de passe incorrect !" })
        return
    }

    // If the user changes his email, check that he's not taking an already existing one
    if (updatedUser.email !== user.email) {
        const existingUser = await User.findOne({ email : updatedUser.email })

        if (existingUser) {
            res.json({
                result: false,
                errorText: 'Adresse email déjà enregistrée sur un autre compte !'
            })
            return
        }

    }

    if (oldPassword && password) {
        const hash = bcrypt.hashSync(password, 10)
        user.password = hash
    }

    Object.assign(user, updatedUser)

    const userData = await user.save();
    const { first_name, last_name, email } = userData

    res.json({ result: true, userSaved: { first_name, last_name, email }, successText: "Modifications enregistrées avec succès !" })
}



// DELETE USER
const deleteUser = async (req, res, next) => {
    const { _id, role, contract_end } = req.user

    if (role !== "client") {
        const now = new Date()
        const contractOver = contract_end && now > contract_end

        if (!contractOver) {
            const blockingAppointments = await hasAppointmentsAfterSelectedDate(_id, now)
            if (blockingAppointments) {
                return res.json({ result: false, errorText: "Erreur : Un ou plusieurs RDV sont programmés en votre présence. Merci de les annuler ou de mettre une fin de contrat supérieure à ceux ci" })
            }
        }

    }

    await Event.deleteMany({ client: _id })

    const data = await User.deleteOne({ _id })

    if (data?.deletedCount === 1) res.json({ result: true, successText: "Compte supprimé !" })
    else res.json({ result: false, errorText: "Erreur : Problème de connexion avec la base de donnée" })
}

module.exports = { updateUser, deleteUser }

