const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    start: Date,
    end: Date,

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },

    event_type: { type: mongoose.Schema.Types.ObjectId, ref: 'event_types' },

    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },

    expiresAt: Date,
},
    { timestamps: true })

eventSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
)
// eventSchema.index({ start: 1, end: 1 });
// eventSchema.index({ employee: 1, start: 1 });
// eventSchema.index({ client: 1, start: 1 });

const Event = mongoose.model('events', eventSchema)
module.exports = Event