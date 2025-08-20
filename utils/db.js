const mongoose = require("mongoose")
// import mongoose from "mongoose"
require('dotenv').config({
  path: ['.env.local', '.env'],
  override: true,
  quiet: true
});



module.exports.dbConnect = async () => {
    try {
        if(process.env.MODE === "prod") {
            await mongoose.connect(process.env.MONGO_URI, {});
             console.log("production database connected ...");
             
        } else {
             await mongoose.connect(process.env.MONGO_URI_LOCAL, {});
             console.log("local database connected ...");
        } 
    } 
    catch (error) {
        console.log(error)
        
    }
};

