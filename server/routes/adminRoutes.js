const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/adminController");

const router = express.Router();
router.use(protect, authorize("admin"));

router.get("/dashboard", c.dashboard);

router.get("/buses", c.listBuses);
router.post("/buses", c.createBus);
router.put("/buses/:id", c.updateBus);
router.delete("/buses/:id", c.deleteBus);

router.get("/routes", c.listRoutes);
router.post("/routes", c.createRoute);
router.put("/routes/:id", c.updateRoute);
router.delete("/routes/:id", c.deleteRoute);

router.get("/schedules", c.listSchedules);
router.post("/schedules", c.createSchedules);
router.put("/schedules/:id", c.updateSchedule);
router.patch("/schedules/:id/status", c.updateScheduleStatus);
router.patch("/schedules/:id/cancel", c.cancelSchedule);
router.delete("/schedules/:id", c.deleteSchedule);

router.get("/users", c.listUsers);
router.post("/users", c.createStaff);
router.patch("/users/:id/role", c.updateUserRole);

router.get("/bookings", c.listBookings);
router.patch("/bookings/:id/status", c.updateBookingStatus);
router.patch("/bookings/:id/cancel", c.cancelBooking);

router.get("/reports", c.reports);

module.exports = router;
