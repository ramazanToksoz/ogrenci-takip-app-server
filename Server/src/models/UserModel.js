const { default: mongoose } = require("mongoose");

const userScheme=new mongoose.Schema({
    name:{type:String},
    lastName:{type:String}
},{collection:"User"})
const User=mongoose.model("User",userScheme)
module.exports=User