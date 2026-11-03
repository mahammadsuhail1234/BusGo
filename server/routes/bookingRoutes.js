
const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Bus = require("../models/Bus");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// POST /api/bookings
router.post("/", protect, authorize("user"), async (req, res) => {
  let busId;
  let seats = [];
  let bookingCreated = false;

  try {
    const { passengers, phone, email } = req.body;
    busId = req.body.busId;

    if (
      !mongoose.isValidObjectId(busId) ||
      !Array.isArray(req.body.selectedSeats) ||
      req.body.selectedSeats.length === 0 ||
      !Array.isArray(passengers) ||
      passengers.length !== req.body.selectedSeats.length ||
      !/^[0-9]{10}$/.test(String(phone || ""))
    ) {
      return res.status(400).json({
        message: "Please provide valid booking and passenger details.",
      });
    }

    seats = req.body.selectedSeats.map(Number);

    if (
      seats.some((seat) => !Number.isInteger(seat) || seat < 1) ||
      new Set(seats).size !== seats.length
    ) {
      return res.status(400).json({
        message: "Seat numbers are invalid or duplicated.",
      });
    }

    const validPassengers = passengers.every(
      (p) =>
        typeof p.name === "string" &&
        p.name.trim().length > 0 &&
        Number.isInteger(Number(p.age)) &&
        Number(p.age) >= 1 &&
        Number(p.age) <= 120 &&
        ["Male", "Female", "Other"].includes(p.gender)
    );

    if (!validPassengers) {
      return res.status(400).json({
        message: "Please enter valid details for every passenger.",
      });
    }

    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found." });
    }

    if (seats.some((seat) => seat > bus.totalSeats)) {
      return res.status(400).json({
        message: "One or more seat numbers are invalid.",
      });
    }

    const existingBooking = await Booking.findOne({
      bus: busId,
      status: { $ne: "Cancelled" },
      selectedSeats: { $in: seats },
    });

    if (existingBooking) {
      return res.status(409).json({
        message: "One or more selected seats are no longer available. Please choose different seats.",
      });
    }

    // Claim seat numbers and decrement capacity in one atomic update.
    const updatedBus = await Bus.findOneAndUpdate(
      {
        _id: busId,
        availableSeats: { $gte: seats.length },
        bookedSeats: { $nin: seats },
      },
      {
        $inc: { availableSeats: -seats.length },
        $addToSet: { bookedSeats: { $each: seats } },
      },
      { new: true }
    );

    if (!updatedBus) {
      return res.status(409).json({
        message: "One or more selected seats are no longer available. Please search again.",
      });
    }

    const totalPrice = seats.length * Number(bus.price);

    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      await Bus.updateOne(
        { _id: busId },
        {
          $inc: { availableSeats: seats.length },
          $pullAll: { bookedSeats: seats },
        }
      );

      return res.status(400).json({ message: "Bus fare is invalid." });
    }

    const booking = await Booking.create({
      bookingId: `BG${new mongoose.Types.ObjectId()
        .toString()
        .slice(-8)
        .toUpperCase()}`,
      user: req.user ? req.user._id : null,
      bus: bus._id,
      selectedSeats: seats,
      passengers: passengers.map((p) => ({
        name: p.name.trim(),
        age: Number(p.age),
        gender: p.gender,
      })),
      phone: String(phone),
      email: String(email || "").trim(),
      totalPrice,
      status: "Pending",
    });

    bookingCreated = true;

    return res.status(201).json({
      message: "Booking saved successfully.",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    // Restore the count if the booking failed after seats were deducted.
    if (busId && seats.length && !bookingCreated) {
      try {
        // Only restore when the bus exists and has enough capacity.
        await Bus.updateOne(
          {
            _id: busId,
            availableSeats: { $lte: Number.MAX_SAFE_INTEGER - seats.length },
          },
          {
            $inc: { availableSeats: seats.length },
            $pullAll: { bookedSeats: seats },
          }
        );
      } catch (restoreError) {
        console.error("Seat count restore error:", restoreError);
      }
    }

    return res.status(500).json({
      message: "Unable to save booking. Please try again.",
    });
  }
});

router.get("/mine", protect, authorize("user"), async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("bus", "busName busNumber source destination travelDate departureTime arrivalTime busType");
    res.json({ bookings });
  } catch (error) {
    console.error("List user bookings error:", error);
    res.status(500).json({ message: "Unable to load your bookings." });
  }
});

router.patch("/:id/cancel", protect, authorize("user"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid booking." });
  }

  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: { $ne: "Cancelled" } },
      {
        status: "Cancelled",
        cancelledAt: new Date(),
        cancelledBy: req.user._id,
        cancelReason: "Cancelled by user",
      },
      { new: true, runValidators: true }
    );

    if (!booking) {
      const exists = await Booking.exists({ _id: req.params.id, user: req.user._id });
      return res.status(exists ? 400 : 404).json({
        message: exists ? "Booking is already cancelled." : "Booking not found.",
      });
    }

    await Bus.updateOne(
      { _id: booking.bus },
      {
        $inc: { availableSeats: booking.selectedSeats.length },
        $pullAll: { bookedSeats: booking.selectedSeats },
      }
    );

    res.json({ message: "Booking cancelled and seats released.", booking });
  } catch (error) {
    console.error("Cancel user booking error:", error);
    res.status(500).json({ message: "Unable to cancel this booking." });
  }
});

module.exports = router;
