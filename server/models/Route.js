const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    distanceKm: { type: Number, default: 0, min: 0 },
    estimatedDuration: { type: String, default: "", trim: true }, // e.g. "2h 30m"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

routeSchema.index({ source: 1, destination: 1 }, { unique: true });

module.exports = mongoose.model("Route", routeSchema);
