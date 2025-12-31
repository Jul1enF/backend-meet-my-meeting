const mongoose = require('mongoose');

const appointmentTypeSchema = mongoose.Schema({
    category: { type: String, default: null }, // men, woman...
    title: String,  // "woman hair color appointment"
    default_duration: Number,
    price : Number,
}, 
{ timestamps: true })

const AppointmentType = mongoose.model('appointment_types', appointmentTypeSchema)

module.exports = AppointmentType