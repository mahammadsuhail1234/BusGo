import bookingRoutes from "./routes/bookingRoutes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", (await import("./routes/authRoutes.js")).default);
app.use("/api/buses", (await import("./routes/busRoutes.js")).default);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", (await import("./routes/adminRoutes.js")).default);
app.use("/api/operator", (await import("./routes/operatorRoutes.js")).default);

// Home route
app.get("/", (req, res) => {
  res.send("Bus Ticket Booking API is running!");
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Bus Ticket Booking backend is working!"
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();