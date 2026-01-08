const Event = require("../models/events.model")
const User = require("../models/users.model")

const { defaultExpirationDate, expiresAt } = require("../constants/eventsContants")


// SAVE A NEW EVENT
const eventRegistration = async (req, res, next) => {
  let { user } = req // The employe saving the event

  const { eventToSave } = req.body
  const { end, start, employee, category, client } = eventToSave

  // Safety check that meanwhile another event has not been registered for this hour
  const blockingEvent = await Event.find({ start: { $lt: end }, end: { $gt: start }, employee })

  const errorText = (category === "closure" || category === "absence") ? "Erreur : un ou plusieurs évènement(s) présent(s) dans ce créneau" : "Erreur : le créneau n'est plus disponible !"

  if (blockingEvent.length) {
    res.json({ result: false, errorText })
  }
  else {
    const expiration = category === "appointment" ? {expiresAt} : {}

    const newEvent = new Event({
      ...eventToSave,
      createdBy: user._id,
      ...expiration,
    })

    const eventSaved = await newEvent.save()
    await eventSaved.populate([
      { path: "appointment_type" },
      { path: "client" }
    ])

    if (category === "appointment" && client?._id){
         await User.findByIdAndUpdate(
        client._id,
        { $addToSet: { events: eventSaved._id } }
      )
    }

    res.status(200).json({ result: true, successText: "Évènement enregistré !", eventSaved })
  }
}


module.exports = { eventRegistration }