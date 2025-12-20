const User = require("../models/users-model")

// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
const getAllUsers = async (req, res, next) => {

    const allUsers = await User.find().select('-password -token')
    allUsers.sort((a, b)=> new Date(b.createdAt) - new Date(a.createdAt))

    res.locals.searchResult = { dataName : "allUsers", data : allUsers}
    next();
}


// UPDATE THE ROLE AND/OR THE SCHEDULE OF A USER

const updateUser = async (req, res, next) => {
    const { _id, userToSave } = req.body
    
    const userSaved = await User.findByIdAndUpdate(
      _id,
      { $set: userToSave},
      {
        new: true,
        runValidators: true
      }
    ).select("-password -token");

     if (!userSaved) { 
        return res.status(404).json({ result : false, errorText: "Utilisateur non trouvé en base de donnée !" })
    }
    else{
        return res.json({result : true, userSaved, successText : "Modifications enregistrées avec succès !"})
    }

}


module.exports = { getAllUsers, updateUser }