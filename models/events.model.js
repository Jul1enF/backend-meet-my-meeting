const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    start: Date,
    end: Date,

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
    unregistered_client : { type : Object, default : null},

    category : { type: String, enum: ['appointment', 'break', 'lunchBreak', 'closure', 'absence', 'workingOverride'], default: 'appointment' },

    appointment_type : { type: mongoose.Schema.Types.ObjectId, ref: 'appointment_types', default: null },

    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },

    // If it is a modified lunch break, field to know the type of the modification :
    lunch_break_modification :{ type: String, enum: ['update', 'suppression'] },

    // If it is a workingOverride, we register the schedule for this working day
    working_schedule: {
    start: String, // "09:00"
    end: String,   // "18:00"
    break: {
      enabled: Boolean,
      start: String,
      end: String
    }
  },

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