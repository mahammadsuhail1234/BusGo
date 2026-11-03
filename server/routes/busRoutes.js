
const express = require("express");
const router = express.Router();

const { getLocations, searchBuses } = require("../controllers/busController");

router.get("/locations", getLocations);
router.get("/search", searchBuses);

module.exports = router;
