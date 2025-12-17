const User = require("../models/users-model")


// GET THE LIST OF ALL USERS TO POSSIBLY MODIFY THEIR ROLE
const getAllUsers = async (req, res, next) => {

    const allUsers = await User.find().select('-password -token')
    allUsers.sort((a, b)=> new Date(b.createdAt) - new Date(a.createdAt))

    res.locals.searchResult = { dataName : "allUsers", data : allUsers}
    next();
}


module.exports = { getAllUsers }