const bcrypt = require('bcrypt')


// UPDATE USER INFORMATIONS
const updateUser = async (req, res, next) => {

    const { name, firstname, email, oldPassword, password } = req.body;

    let { user } = req;

    user.name = name;
    user.firstname = firstname;
    user.email = email;

    // Password comparison if an old one is provided

    if (oldPassword && !bcrypt.compareSync(oldPassword, user.password)) {
        res.json({ result: false, error: "Ancien mot de passe incorrect !" })
        return
    }

    if (oldPassword && password) {
        const hash = bcrypt.hashSync(password, 10)
        user.password = hash
    }

    await user.save();

    res.json({ result: true })
}

module.exports = { updateUser }

