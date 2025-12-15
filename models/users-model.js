const mongoose = require('mongoose');

const absencesSchema = mongoose.Schema({
    start: Date,
    end: Date,
    reason: String,
}, { _id: false })

const userSchema = mongoose.Schema({
    first_name: String,
    last_name: String,
    email: { type: String, required: true, unique: true },
    password: String,
    token: String,
    role: { type: String, enum: ['admin', 'coworker', 'client'], default: 'client' },
    is_available: { type: Boolean, default: false },
    working_hours: { type: Object, default: null },
    absences: [absencesSchema],
    appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'appointments' }],
},
    { timestamps: true })


const User = mongoose.model('users', userSchema)

module.exports = User