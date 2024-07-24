const express = require("express");
const axios = require("axios");

require("dotenv").config();

const router = express.Router();

const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL;

router.post("/", async (req, res) => {
  try {
    const response = await axios.post(`${SUBSCRIPTION_SERVICE_URL}`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response.status).json({ message: err.response.data });
  }
});

// Get subscription by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const response = await axios.get(
      `${SUBSCRIPTION_SERVICE_URL}/user/${req.params.userId}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response.status).json({ message: err.response.data });
  }
});

router.put("/:subscriptionId", async (req, res) => {
  try {
    const response = await axios.put(
      `${SUBSCRIPTION_SERVICE_URL}/${req.params.subscriptionId}`,
      req.body
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response.status).json({ message: err.response.data });
  }
});

module.exports = router;
