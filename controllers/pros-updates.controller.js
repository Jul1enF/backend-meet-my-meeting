const User = require("../models/users.model")
const AppointmentType = require("../models/appointment-types.model")

const { getAppointmentTypeExpiration, defaultSchedule } = require("../constants/documentConstants")
const { hasAppointmentsAfterSelectedDate } = require("../utils/safetyChecks")

// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
const getAllUsers = async (req, res, next) => {

  const allUsers = await User.find().select('-password -token').lean()
  allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const usersInformations = { allUsers, constants: { defaultSchedule } }

  res.locals.searchResult = { dataName: "usersInformations", data: usersInformations }
  next();
}


// UPDATE THE ROLE AND/OR THE SCHEDULE AND CONTRACT END OF A USER

const updateUser = async (req, res, next) => {
  const { _id, userToSave } = req.body

  if (userToSave.contract_end) {
    const blockingAppointments = await hasAppointmentsAfterSelectedDate(_id, new Date(userToSave.contract_end))

    if (blockingAppointments) {
      return res.json({ result: false, errorText: "Erreur : Un ou plusieurs RDV sont programmés en la présence de l'employé après sa fin de contrat." })
    }
  }


  const userSaved = await User.findByIdAndUpdate(
    _id,
    { $set: userToSave },
    {
      new: true,
      runValidators: true
    }
  ).select("-password -token");

  if (!userSaved) {
    return res.status(404).json({ result: false, errorText: "Utilisateur non trouvé en base de donnée !" })
  }
  else {
    return res.json({ result: true, userSaved, successText: "Modifications enregistrées avec succès !" })
  }

}


// GET THE LIST OF ALL THE APPOINTMENT TYPES
const getAppointmentsTypes = async (req, res, next) => {
  const appointmentsTypes = await AppointmentType.find({ expiresAt: { $exists: false } }).lean()

  res.json({ result: true, appointmentsTypes })
}

// CREATE OR UPDATE AN APPOINTMENT
const appointmentTypesModification = async (req, res, next) => {
  const { appointmentTypeToSave, newAppointmentType, _id } = req.body
  let appointmentTypeSaved

  // Update
  if (!newAppointmentType) {
    appointmentTypeSaved = await AppointmentType.findByIdAndUpdate(
      _id,
      { $set: appointmentTypeToSave },
      {
        new: true,
        runValidators: true
      }
    )
  }
  // Create
  else {
    const newAppointmentType = new AppointmentType(appointmentTypeToSave)
    appointmentTypeSaved = await newAppointmentType.save()
  }

  if (!appointmentTypeSaved) {
    return res.status(404).json({ result: false, errorText: "Erreur : Problème de connexion avec la base de donnée." })
  }
  else {
    return res.json({ result: true, appointmentTypeSaved, successText: `${newAppointmentType ? "Modèle enregistré" : "Modifications enregistrées"} avec succès !` })
  }
}


// DELETE AN APPOINTMENT TYPE (BY PUTING TO IT AN EXPIRATION DATE)
const deleteAppointmentType = async (req, res, next) => {
  const { _id } = req.body

  await AppointmentType.findByIdAndUpdate(
    _id,
    { expiresAt: getAppointmentTypeExpiration() }
  )
  return res.json({ result: true, successText: "Modèle supprimé !" })
}


module.exports = { getAllUsers, updateUser, getAppointmentsTypes, appointmentTypesModification, deleteAppointmentType }