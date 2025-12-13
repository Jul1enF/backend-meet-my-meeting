const mongoose =require('mongoose')

const userSchema = mongoose.Schema({
    firstname : String,
    name : String,
    email : String,
    password : String,
    is_admin : {type : Boolean, default : false},
    token : String,
}, { timestamps: true })

const User = mongoose.model('users', userSchema)

module.exports = User