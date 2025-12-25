const mongoose = require('mongoose');

// IN THE SCHEDULE OBJECT : 0 = MONDAY

const userSchema = mongoose.Schema({
    first_name: String,
    last_name: String,
    email: { type: String, unique: true },
    password: String,
    token: String,
    role: { type: String, enum: ['owner', 'admin', 'employee', 'client'], default: 'client' },
    schedule: { type: Object, default: null },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'events' }],
},
    { timestamps: true })


const User = mongoose.model('users', userSchema)

module.exports = User