const express = require("express");
const mongoose = require("mongoose");
const { protect, authorize } = require("../middleware/auth");
const FleetBus = require("../models/FleetBus");
const Bus = require("../models/Bus");
const Booking = require("../models/Booking");

const router = express.Router();
router.use(protect, authorize("operator"));

const myFleetIds = async (userId) =>
  (await FleetBus.find({ assignedOperator: userId }, "_id")).map((b) => b._id);

// GET /api/operator/buses
router.get("/buses", async (req, res) => {
  const buses = await FleetBus.find({ assignedOperator: req.user._id }).sort({ busName: 1 });
  res.json({ buses });
});

// GET /api/operator/schedules?date=&from=&to=&status=
router.get("/schedules", async (req, res) => {
  const { date, from, to, status } = req.query;
  const filter = { fleetBus: { $in: await myFleetIds(req.user._id) } };
  if (date) filter.travelDate = date;
  else if (from || to) filter.travelDate = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (status) filter.tripStatus = status;

  const schedules = await Bus.find(filter).sort({ travelDate: 1, departureTime: 1 }).limit(300).lean();

  // seats booked per trip
  const counts = await Booking.aggregate([
    { $match: { bus: { $in: schedules.map((s) => s._id) }, status: { $ne: "Cancelled" } } },
    { $group: { _id: "$bus", seats: { $sum: { $size: "$selectedSeats" } } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.seats]));
  res.json({ schedules: schedules.map((s) => ({ ...s, bookedSeats: map.get(String(s._id)) || 0 })) });
});

const loadOwnTrip = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: "Invalid trip." });
    return null;
  }
  const trip = await Bus.findById(req.params.id);
  const ids = (await myFleetIds(req.user._id)).map(String);
  if (!trip || !trip.fleetBus || !ids.includes(String(trip.fleetBus))) {
    res.status(404).json({ message: "Trip not found among your assigned buses." });
    return null;
  }
  return trip;
};

// GET /api/operator/schedules/:id/passengers
router.get("/schedules/:id/passengers", async (req, res) => {
  const trip = await loadOwnTrip(req, res);
  if (!trip) return;

  const bookings = await Booking.find({ bus: trip._id, status: { $ne: "Cancelled" } }).sort({ createdAt: 1 });
  const passengers = [];
  for (const b of bookings) {
    b.passengers.forEach((p, i) => {
      passengers.push({
        seat: b.selectedSeats[i],
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: b.phone,
        bookingId: b.bookingId,
        bookingStatus: b.status,
      });
    });
  }
  passengers.sort((a, b) => a.seat - b.seat);
  res.json({ trip, passengers });
});

// PATCH /api/operator/schedules/:id/status
const ALLOWED = ["Scheduled", "Boarding", "Departed", "Delayed", "Arrived", "Cancelled"];
router.patch("/schedules/:id/status", async (req, res) => {
  const { tripStatus } = req.body;
  if (!ALLOWED.includes(tripStatus)) return res.status(400).json({ message: "Invalid trip status." });

  const trip = await loadOwnTrip(req, res);
  if (!trip) return;

  trip.tripStatus = tripStatus;
  // Keep the public search flag in sync: only open trips stay searchable
  trip.status = tripStatus === "Cancelled" ? "cancelled" : ["Departed", "Arrived"].includes(tripStatus) ? "completed" : "scheduled";
  if (tripStatus === "Cancelled") {
    await Booking.updateMany(
      { bus: trip._id, status: { $ne: "Cancelled" } },
      {
        status: "Cancelled",
        cancelledAt: new Date(),
        cancelledBy: req.user._id,
        cancelReason: "Trip cancelled by operator",
      }
    );
    trip.availableSeats = trip.totalSeats;
    trip.bookedSeats = [];
  }
  await trip.save();
  res.json({ message: `Trip marked as ${tripStatus}.`, schedule: trip });
});

// PATCH /api/operator/schedules/:id/location
router.patch("/schedules/:id/location", async (req, res) => {
  const trip = await loadOwnTrip(req, res);
  if (!trip) return;

  if (req.body.sharing === false) {
    await Bus.updateOne({ _id: trip._id }, { $set: { "liveLocation.sharing": false } });
    return res.json({ message: "Location sharing stopped." });
  }

  const { latitude, longitude, accuracy } = req.body;
  if (
    typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    (accuracy !== undefined && (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0))
  ) {
    return res.status(400).json({ message: "A valid GPS location is required." });
  }
  if (["Arrived", "Cancelled"].includes(trip.tripStatus)) {
    return res.status(409).json({ message: "Location sharing is unavailable for completed or cancelled trips." });
  }

  trip.liveLocation = { latitude, longitude, accuracy, updatedAt: new Date(), sharing: true };
  await trip.save();
  res.json({ message: "Bus location updated." });
});

module.exports = router;
