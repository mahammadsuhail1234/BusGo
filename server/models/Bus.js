
const mongoose = require("mongoose");

const liveLocationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    accuracy: { type: Number, min: 0 },
    updatedAt: { type: Date },
    sharing: { type: Boolean, default: true },
  },
  { _id: false }
);

const busSchema = new mongoose.Schema(
  {
    busName: {
      type: String,
      required: true,
      trim: true,
    },

    busNumber: {
      type: String,
      required: true,
      trim: true,
    },

    operator: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    departureTime: {
      type: String,
      required: true,
    },

    arrivalTime: {
      type: String,
      required: true,
    },

    travelDate: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    bookedSeats: {
      type: [Number],
      default: [],
    },

    busType: {
      type: String,
      default: "AC Seater",
    },

    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },

    // --- Added for Admin / Operator portals ---
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },
    fleetBus: { type: mongoose.Schema.Types.ObjectId, ref: "FleetBus", default: null },
    tripStatus: {
      type: String,
      enum: ["Scheduled", "Boarding", "Departed", "Delayed", "Arrived", "Cancelled"],
      default: "Scheduled",
    },
    liveLocation: { type: liveLocationSchema, default: undefined, select: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bus", busSchema);
