const mongoose = require('mongoose');

const eventTypeSchema = mongoose.Schema({
    category: { type: String, enum: ['appointment', 'break', 'closure', 'absence'], default: 'appointment' },
    sub_category: String || null, // men, woman...
    title: String,  // "woman hair color appointment"
    default_duration: Number,
    price : Number,
}, 
{ timestamps: true })

const EventType = mongoose.model('event_types', eventTypeSchema)

module.exports = EventType