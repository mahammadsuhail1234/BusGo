const bookingRoutes = require("./routes/bookingRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/buses", require("./routes/busRoutes"));
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/operator", require("./routes/operatorRoutes"));

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

// Start server after connecting to MongoDB
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
