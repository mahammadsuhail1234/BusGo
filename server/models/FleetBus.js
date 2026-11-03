const mongoose = require("mongoose");

// A physical bus owned/managed by the company
const fleetBusSchema = new mongoose.Schema(
  {
    busName: { type: String, required: true, trim: true },
    busNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    operator: { type: String, required: true, trim: true }, // travel company name
    busType: { type: String, default: "AC Seater", trim: true },
    totalSeats: { type: Number, required: true, min: 1, max: 80 },
    assignedOperator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FleetBus", fleetBusSchema);
