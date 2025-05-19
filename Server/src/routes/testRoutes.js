const express = require('express');
const router=express.Router()
const { test } = require("../controllers/test")
const checkToken = require("../middlewares/token/checkToken")




router.get("/",checkToken,test)
module.exports=router