
const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cancelReason: { type: String, default: "" },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    selectedSeats: {
      type: [Number],
      required: true,
      validate: {
        validator: (seats) =>
          seats.length > 0 && new Set(seats).size === seats.length,
        message: "Select at least one unique seat.",
      },
    },
    passengers: {
      type: [passengerSchema],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
