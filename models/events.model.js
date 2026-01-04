const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    start: Date,
    end: Date,

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },

    category : { type: String, enum: ['appointment', 'break', 'lunchBreak', 'closure', 'absence'], default: 'appointment' },

    appointment_type : { type: mongoose.Schema.Types.ObjectId, ref: 'appointment_types', default: null },

    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },

    expiresAt: Date,
},
    { timestamps: true })

eventSchema.index(
    { expiresAt: 1 },
    { 
        expireAfterSeconds: 0, 
        partialFilterExpression: { expiresAt: { $exists: true } }
    }
)

eventSchema.index({ start: 1, end: 1 })

const Event = mongoose.model('events', eventSchema)
module.exports = Event