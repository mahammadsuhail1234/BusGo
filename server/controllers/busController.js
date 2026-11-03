
const Bus = require("../models/Bus");
const Booking = require("../models/Booking");
const Route = require("../models/Route");

const getLocations = async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true }, "source destination").lean();
    const locations = new Map();

    routes.forEach(({ source, destination }) => {
      [source, destination].forEach((value) => {
        const name = String(value || "").trim();
        if (name && !locations.has(name.toLocaleLowerCase())) {
          locations.set(name.toLocaleLowerCase(), name);
        }
      });
    });

    res.json({ success: true, locations: [...locations.values()].sort((a, b) => a.localeCompare(b)) });
  } catch (error) {
    console.error("Location lookup error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load locations." });
  }
};

// Search buses
const searchBuses = async (req, res) => {
  try {
    const { source, destination, date } = req.query;

    if (!source || !destination || !date) {
      return res.status(400).json({
        success: false,
        message: "Source, destination and travel date are required."
      });
    }

    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Source and destination must be different."
      });
    }

    const buses = await Bus.find({
      source: { $regex: `^${source.trim()}$`, $options: "i" },
      destination: { $regex: `^${destination.trim()}$`, $options: "i" },
      travelDate: date,
      status: "scheduled",
      availableSeats: { $gt: 0 }
    }).sort({ departureTime: 1 });

    const bookings = await Booking.find(
      { bus: { $in: buses.map((b) => b._id) }, status: { $ne: "Cancelled" } },
      "bus selectedSeats"
    );
    const seatMap = {};
    bookings.forEach((bk) => {
      (seatMap[bk.bus] = seatMap[bk.bus] || []).push(...bk.selectedSeats);
    });

    return res.json({
      success: true,
      count: buses.length,
      buses: buses.map((b) => ({ ...b.toObject(), bookedSeats: seatMap[b._id] || [] }))
    });
  } catch (error) {
    console.error("Bus search error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to search buses right now."
    });
  }
};

module.exports = { getLocations, searchBuses };
