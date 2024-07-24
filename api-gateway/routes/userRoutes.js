// routes/userRoutes.js
const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

router.post("/register", async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/register`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response.status).json({ message: err.response.data });
  }
});

router.post("/login", async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/login`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response.status).json({ message: err.response.data });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/profile`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response.status).json({ message: err.response.data });
  }
});

module.exports = router;
