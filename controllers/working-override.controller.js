const Event = require("../models/events.model")
const User = require("../models/users.model")

const { getEventExpiration } = require("../constants/documentConstants")

const { hasNewScheduleConflict } = require('../utils/safetyChecks')

const { DateTime } = require("luxon")


// CREATE OR UPDATE A WORKING OVERRIDE
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
    const newScheduleConflict = await hasNewScheduleConflict({ start, end, employee, lunchBreak: working_schedule.break })

    if (newScheduleConflict) {
        return res.json({ result: false, errorText: "Erreur : Un ou plusieurs évènements empêchent ce changement !" })
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
            {
                $set: {
                    ...eventToSave,
                    updatedBy: user._id,
                }
            },
            { new: true, runValidators: true }
        )
    }


    const successText = `${!isUpdate ? "Nouvelle j" : "J"}ournée de travail ${!isUpdate ? "enregistrée" : "modifiée"} avec succès !`

    res.status(200).json({ result: true, successText, eventSaved })

}


// DELETE A WORKING OVERRIDE
const deleteWorkingOverride = async (req, res, next) => {
    const { user } = req // The employe deleting the event

    const { eventId, employeeId } = req.params

    const userDeletingForHimself = user._id.toString() === employeeId

    // SAFETY CHECKS
    // Safety check that it is not an employee posting an override working deletion for another one
    if (!userDeletingForHimself && user.role !== "owner") {
        return res.json({ result: false, errorText: "Erreur : Utilisateur non autorisé à poster ce changement" })
    }

    // Safety check that the event is still in db
    const eventToDelete = await Event.findById(eventId)

    if (!eventToDelete) {
        return res.json({ result: false, errorText: "Erreur : Journée modifiée non trouvée en base de donnée !" })
    }

    // Safety check that there is no appointment at all register on that day if it was originally a dayOff or else that presents appointments fits the employee default schedule

    const dayIndex = DateTime.fromJSDate(eventToDelete.start, { zone: "Europe/Paris" }).weekday - 1

    const concernedEmployee = userDeletingForHimself ? { ...user } : await User.findById(employeeId)

    const formerWorkedDay = concernedEmployee.schedule[dayIndex].enabled ? concernedEmployee.schedule[dayIndex] : false

    if (formerWorkedDay) {
        const {start, end, break : lunchBreak} = formerWorkedDay
        const newScheduleConflict = await hasNewScheduleConflict({start, end, employee : concernedEmployee._id, lunchBreak })

        if (newScheduleConflict) {
            return res.json({ result: false, errorText: "Erreur : Un ou plusieurs RDV empêchent ce changement !" })
        }
    }


}


module.exports = { workingOverrideSaving, deleteWorkingOverride }