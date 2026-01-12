const mongoose = require('mongoose');

const appointmentTypeSchema = mongoose.Schema({
    category: { type: String, default: null }, // men, woman...
    title: String,  // "woman hair color appointment"
    default_duration: Number,
    price : Number,

    expiresAt : Date,
}, 
{ timestamps: true })


appointmentTypeSchema.index(
    { expiresAt: 1 },
    { 
        expireAfterSeconds: 0, 
        partialFilterExpression: { expiresAt: { $exists: true } }
    }
)

const AppointmentType = mongoose.model('appointment_types', appointmentTypeSchema)

module.exports = AppointmentType