const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;

router.post("/send", async (req, res) => { 
    try {
        const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/send`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
})

module.exports = router;