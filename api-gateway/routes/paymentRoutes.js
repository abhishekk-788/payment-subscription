const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL;

// Payment API
router.post("/", async (req, res) => { 
    try {
        const response = await axios.post(`${PAYMENT_SERVICE_URL}`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
})

router.put("/extend/:paymentId", async (req, res) => { 
    try {
        const response = await axios.put(`${PAYMENT_SERVICE_URL}/extend/${req.params.paymentId}`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
})

router.get("/:paymentId", async (req, res) => { 
    try {
        const response = await axios.get(`${PAYMENT_SERVICE_URL}/${req.params.paymentId}`);
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
})

module.exports = router;