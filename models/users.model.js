const mongoose = require('mongoose');

// IN THE SCHEDULE OBJECT : 0 = MONDAY

// An employee can't :
// - access users list and modify their status
// - access appointments types list and modify it
// - create closure events
// - create a break or absence event for someone else

const userSchema = mongoose.Schema({
    first_name: String,
    last_name: String,
    email: { type: String, unique: true },
    password: String,
    token: String,
    role: { type: String, enum: ['owner', 'admin', 'employee', 'client'], default: 'client' },
    schedule: { type: Object, default: null },
    contract_end : { type : Date, default : null},
},
    { timestamps: true })

userSchema.index({ role: 1, contract_end: 1, createdAt: 1 })
userSchema.index({ role: 1, last_name: 1 })


const User = mongoose.model('users', userSchema)

module.exports = User