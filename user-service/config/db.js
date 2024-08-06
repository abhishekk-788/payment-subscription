const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI
// const mongoURI = "mongodb://localhost:27017/payment-db";

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {});
        console.log("MongoDB connected...");
    } catch (error) { 
        console.log(error.message);
    }
}

// (async() => {
//     await connectDB();
// })();

module.exports = connectDB;