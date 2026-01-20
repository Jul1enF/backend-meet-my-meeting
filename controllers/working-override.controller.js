const Event = require("../models/events.model")
const User = require("../models/users.model")

const { getEventExpiration } = require("../constants/documentConstants")

const { hasWorkingOverrideConflict } = require('../utils/safetyChecks')


const workingOverrideSaving = async (req, res, next) => {
    let { user } = req // The employe saving the event

    const { eventToSave } = req.body
    const { end, start, employee, _id, working_schedule } = eventToSave

    const isUpdate = Boolean(_id)

    // SAFETY CHECKS
    // Safety check that it is not an employee posting an override working day modification for another one
    if (
        user.role === "employee"
        && employee.toString() !== user._id.toString()
    ) {
        return res.json({ result: false, errorText: "Erreur : utilisateur non autorisé à poster ce changement" })
    }

    // Safety check that there is no appointment blocking this change
    const workingOverrideConflict = await hasWorkingOverrideConflict({start, end, employee, lunchBreak : working_schedule.break, idToExclude : _id})

    if (workingOverrideConflict) {
        return res.json({ result: false, errorText: "Erreur : Un ou plusieurs RDV empêchent ce changement !" })
    }


    // Futur doc saved
    let eventSaved

    // CREATE
    if (!isUpdate) {

        const formattedEventToSave = new Event({
            ...eventToSave,
            createdBy: user._id,
            expiresAt: getEventExpiration(),
        })

        eventSaved = await formattedEventToSave.save()
    }
    // UPDATE
    else {
        eventSaved = await Event.findByIdAndUpdate(
            _id,
            { $set: { 
                ...eventToSave,
                updatedBy: user._id,
            }},
            { new: true, runValidators: true }
        )
    }


    const successText = `${!isUpdate ? "Nouvelle j" : "J"}ournée de travail ${!isUpdate ? "enregistrée" : "modifiée"} avec succès !`

    res.status(200).json({ result: true, successText, eventSaved })

}

module.exports = { workingOverrideSaving }