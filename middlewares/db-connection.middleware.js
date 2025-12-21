const mongoose = require('mongoose')
const connectionString = process.env.CONNECTION_STRING

module.exports = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(connectionString, { connectTimeoutMS: 6000 })
            console.log("DB CONNECTED")
        }
        next()
    } catch (err) {
        res.status(500).json({ result: false, errorText: "Erreur : Problème de connexion" })
    }
}