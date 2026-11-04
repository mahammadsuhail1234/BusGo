const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Bus = require("../models/Bus");
const Booking = require("../models/Booking");
const FleetBus = require("../models/FleetBus");
const Route = require("../models/Route");

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(409).json({ message: "That record already exists." });
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message || "Server error" });
  }
};

const todayString = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------------- Dashboard ---------------- */
const dashboard = wrap(async (req, res) => {
  const today = todayString();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [buses, routes, users, bookings, upcomingTrips, revenueAgg, todayAgg, recentBookings] = await Promise.all([
    FleetBus.countDocuments({ isActive: true }),
    Route.countDocuments({ isActive: true }),
    User.countDocuments({ role: "user" }),
    Booking.countDocuments(),
    Bus.countDocuments({ travelDate: { $gte: today }, status: "scheduled" }),
    Booking.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: startOfDay }, status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
    ]),
    Booking.find().sort({ createdAt: -1 }).limit(6).populate("bus", "busName source destination travelDate departureTime"),
  ]);

  res.json({
    stats: {
      buses,
      routes,
      users,
      bookings,
      upcomingTrips,
      revenue: revenueAgg[0]?.total || 0,
      activeBookings: revenueAgg[0]?.count || 0,
      todayBookings: todayAgg[0]?.count || 0,
      todayRevenue: todayAgg[0]?.total || 0,
    },
    recentBookings,
  });
});

/* ---------------- Fleet buses ---------------- */
const listBuses = wrap(async (req, res) => {
  const buses = await FleetBus.find().populate("assignedOperator", "name email").sort({ createdAt: -1 });
  res.json({ buses });
});

const busFields = ["busName", "busNumber", "operator", "busType", "totalSeats", "isActive"];
const pick = (body, fields) => Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const validateOperatorId = async (id) => {
  if (!id) return null;
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid operator.");
  const op = await User.findById(id);
  if (!op || op.role !== "operator") throw new Error("Selected user is not an operator.");
  return op._id;
};

const createBus = wrap(async (req, res) => {
  const data = pick(req.body, busFields);
  data.assignedOperator = await validateOperatorId(req.body.assignedOperator);
  const bus = await FleetBus.create(data);
  res.status(201).json({ bus });
});

const updateBus = wrap(async (req, res) => {
  const data = pick(req.body, busFields);
  if (req.body.assignedOperator !== undefined) data.assignedOperator = await validateOperatorId(req.body.assignedOperator);
  const bus = await FleetBus.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!bus) return res.status(404).json({ message: "Bus not found." });
  res.json({ bus });
});

const deleteBus = wrap(async (req, res) => {
  const used = await Bus.countDocuments({ fleetBus: req.params.id, travelDate: { $gte: todayString() }, status: "scheduled" });
  if (used > 0) {
    return res.status(409).json({ message: `This bus has ${used} upcoming schedule(s). Cancel or delete them first.` });
  }
  await FleetBus.findByIdAndDelete(req.params.id);
  res.json({ message: "Bus deleted." });
});

/* ---------------- Routes ---------------- */
const listRoutes = wrap(async (req, res) => {
  res.json({ routes: await Route.find().sort({ source: 1, destination: 1 }) });
});

const routeFields = ["source", "destination", "distanceKm", "estimatedDuration", "isActive"];

const createRoute = wrap(async (req, res) => {
  const data = pick(req.body, routeFields);
  if (data.source && data.destination && data.source.trim().toLowerCase() === data.destination.trim().toLowerCase()) {
    return res.status(400).json({ message: "Source and destination must be different." });
  }
  res.status(201).json({ route: await Route.create(data) });
});

const updateRoute = wrap(async (req, res) => {
  const route = await Route.findByIdAndUpdate(req.params.id, pick(req.body, routeFields), { new: true, runValidators: true });
  if (!route) return res.status(404).json({ message: "Route not found." });
  res.json({ route });
});

const deleteRoute = wrap(async (req, res) => {
  const used = await Bus.countDocuments({ route: req.params.id, travelDate: { $gte: todayString() }, status: "scheduled" });
  if (used > 0) return res.status(409).json({ message: `This route has ${used} upcoming schedule(s).` });
  await Route.findByIdAndDelete(req.params.id);
  res.json({ message: "Route deleted." });
});

/* ---------------- Schedules (trips stored in Bus collection) ---------------- */
const listSchedules = wrap(async (req, res) => {
  const { date, from, to, status, routeId, busId } = req.query;
  const filter = {};
  if (date) filter.travelDate = date;
  else if (from || to) filter.travelDate = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (status) filter.tripStatus = status;
  if (routeId && mongoose.isValidObjectId(routeId)) filter.route = routeId;
  if (busId && mongoose.isValidObjectId(busId)) filter.fleetBus = busId;

  const schedules = await Bus.find(filter).select("+liveLocation").sort({ travelDate: 1, departureTime: 1 }).limit(500)
    .populate("fleetBus", "busName busNumber").populate("route", "source destination");
  res.json({ schedules });
});

const dateRange = (start, end) => {
  const out = [];
  const d = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (d <= last && out.length < 92) {
    out.push([d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-"));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const createSchedules = wrap(async (req, res) => {
  const { fleetBus: fleetBusId, route: routeId, departureTime, arrivalTime, price, startDate, endDate } = req.body;

  if (!mongoose.isValidObjectId(fleetBusId) || !mongoose.isValidObjectId(routeId)) {
    return res.status(400).json({ message: "Please select a bus and a route." });
  }
  if (!departureTime || !arrivalTime || !startDate || price === undefined || price === "") {
    return res.status(400).json({ message: "Departure, arrival, price and start date are required." });
  }
  if (Number(price) < 0) return res.status(400).json({ message: "Price cannot be negative." });

  const [fleet, route] = await Promise.all([FleetBus.findById(fleetBusId), Route.findById(routeId)]);
  if (!fleet || !route) return res.status(404).json({ message: "Bus or route not found." });
  if (!fleet.isActive) return res.status(400).json({ message: "This bus is inactive." });

  const dates = dateRange(startDate, endDate || startDate);
  if (dates.length === 0) return res.status(400).json({ message: "Invalid date range." });

  // Skip dates where this bus already has a trip at the same departure time
  const existing = await Bus.find({ fleetBus: fleet._id, departureTime, travelDate: { $in: dates } }, "travelDate");
  const taken = new Set(existing.map((e) => e.travelDate));
  const newDates = dates.filter((d) => !taken.has(d));

  if (newDates.length === 0) {
    return res.status(409).json({ message: "Schedules already exist for all selected dates." });
  }

  const docs = newDates.map((travelDate) => ({
    busName: fleet.busName,
    busNumber: fleet.busNumber,
    operator: fleet.operator,
    busType: fleet.busType,
    totalSeats: fleet.totalSeats,
    availableSeats: fleet.totalSeats,
    source: route.source,
    destination: route.destination,
    departureTime,
    arrivalTime,
    price: Number(price),
    travelDate,
    route: route._id,
    fleetBus: fleet._id,
    status: "scheduled",
    tripStatus: "Scheduled",
  }));

  await Bus.insertMany(docs);
  res.status(201).json({
    message: `${docs.length} schedule(s) created${taken.size ? `, ${taken.size} skipped (already existed)` : ""}.`,
    created: docs.length,
    skipped: taken.size,
  });
});

const updateSchedule = wrap(async (req, res) => {
  const trip = await Bus.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Schedule not found." });

  const { departureTime, arrivalTime, price, travelDate } = req.body;
  if (departureTime) trip.departureTime = departureTime;
  if (arrivalTime) trip.arrivalTime = arrivalTime;
  if (price !== undefined && price !== "") trip.price = Number(price);
  if (travelDate) trip.travelDate = travelDate;
  await trip.save();
  res.json({ schedule: trip });
});

const updateScheduleStatus = wrap(async (req, res) => {
  const allowedStatuses = ["Scheduled", "Boarding", "Departed", "Delayed", "Arrived"];
  const { tripStatus } = req.body;
  if (!allowedStatuses.includes(tripStatus)) {
    return res.status(400).json({ message: "Invalid trip status. Cancel trips using the cancel action." });
  }

  const trip = await Bus.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Schedule not found." });
  if (trip.tripStatus === "Cancelled") {
    return res.status(409).json({ message: "A cancelled trip cannot be reopened." });
  }

  trip.tripStatus = tripStatus;
  trip.status = ["Departed", "Arrived"].includes(tripStatus) ? "completed" : "scheduled";
  await trip.save();
  res.json({ message: `Trip marked as ${tripStatus}.`, schedule: trip });
});

// Cancels all active bookings on a trip and flags the trip as cancelled
const cancelTripBookings = async (tripId, adminId, reason) => {
  const result = await Booking.updateMany(
    { bus: tripId, status: { $ne: "Cancelled" } },
    { status: "Cancelled", cancelledAt: new Date(), cancelledBy: adminId, cancelReason: reason }
  );
  return result.modifiedCount;
};

const cancelSchedule = wrap(async (req, res) => {
  const trip = await Bus.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Schedule not found." });

  const cancelled = await cancelTripBookings(trip._id, req.user._id, "Trip cancelled by admin");
  trip.status = "cancelled";
  trip.tripStatus = "Cancelled";
  trip.availableSeats = trip.totalSeats;
  trip.bookedSeats = [];
  await trip.save();
  res.json({ message: `Trip cancelled. ${cancelled} booking(s) were cancelled.`, schedule: trip });
});

const deleteSchedule = wrap(async (req, res) => {
  const count = await Booking.countDocuments({ bus: req.params.id, status: { $ne: "Cancelled" } });
  if (count > 0) {
    return res.status(409).json({ message: `This trip has ${count} active booking(s). Cancel the trip instead.` });
  }
  await Bus.findByIdAndDelete(req.params.id);
  res.json({ message: "Schedule deleted." });
});

/* ---------------- Users ---------------- */
const listUsers = wrap(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).lean();
  const counts = await Booking.aggregate([{ $match: { user: { $ne: null } } }, { $group: { _id: "$user", n: { $sum: 1 } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ users: users.map((u) => ({ ...u, bookingCount: map.get(String(u._id)) || 0 })) });
});

const createStaff = wrap(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
  if (!["operator", "admin", "user"].includes(role)) return res.status(400).json({ message: "Invalid role." });

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: await bcrypt.hash(password, 12),
    role,
  });
  res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
});

const updateUserRole = wrap(async (req, res) => {
  const { role } = req.body;
  if (!["operator", "admin", "user"].includes(role)) return res.status(400).json({ message: "Invalid role." });
  if (String(req.user._id) === req.params.id) return res.status(400).json({ message: "You cannot change your own role." });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found." });
  if (role !== "operator") await FleetBus.updateMany({ assignedOperator: user._id }, { assignedOperator: null });
  res.json({ user });
});

/* ---------------- Bookings ---------------- */
const listBookings = wrap(async (req, res) => {
  const { status, search, date } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ bookingId: rx }, { phone: rx }, { email: rx }, { "passengers.name": rx }];
  }
  if (date) {
    const trips = await Bus.find({ travelDate: date }, "_id");
    filter.bus = { $in: trips.map((t) => t._id) };
  }
  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).limit(300)
    .populate("bus", "busName busNumber source destination travelDate departureTime")
    .populate("user", "name email");
  res.json({ bookings });
});

const cancelBooking = wrap(async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, status: { $ne: "Cancelled" } },
    {
      status: "Cancelled",
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
      cancelReason: String(req.body.reason || "Cancelled by admin").slice(0, 200),
    },
    { new: true, runValidators: true }
  );
  if (!booking) {
    const exists = await Booking.exists({ _id: req.params.id });
    return res.status(exists ? 400 : 404).json({
      message: exists ? "Booking is already cancelled." : "Booking not found.",
    });
  }

  // Free the seats again
  await Bus.updateOne(
    { _id: booking.bus },
    {
      $inc: { availableSeats: booking.selectedSeats.length },
      $pullAll: { bookedSeats: booking.selectedSeats },
    }
  );
  res.json({ message: "Booking cancelled and seats released.", booking });
});

const updateBookingStatus = wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid booking." });
  }

  const { status } = req.body;
  if (!["Pending", "Confirmed"].includes(status)) {
    return res.status(400).json({ message: "Status must be Pending or Confirmed." });
  }

  const booking = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      status: status === "Confirmed" ? { $in: ["Pending", "Confirmed"] } : "Pending",
    },
    { status },
    { new: true, runValidators: true }
  );

  if (!booking) {
    const existingBooking = await Booking.findById(req.params.id, "status");
    const message = !existingBooking
      ? "Booking not found."
      : existingBooking.status === "Cancelled"
        ? "Cancelled bookings cannot be reactivated."
        : "Confirmed bookings cannot be changed back to pending.";
    return res.status(existingBooking ? 409 : 404).json({
      message,
    });
  }

  res.json({ message: `Booking status updated to ${status}.`, booking });
});

/* ---------------- Reports ---------------- */
const reports = wrap(async (req, res) => {
  const end = req.query.to ? new Date(`${req.query.to}T23:59:59.999`) : new Date();
  const start = req.query.from ? new Date(`${req.query.from}T00:00:00`) : new Date(end.getTime() - 29 * 86400000);
  start.setHours(0, 0, 0, 0);

  const match = { createdAt: { $gte: start, $lte: end } };
  const active = { ...match, status: { $ne: "Cancelled" } };

  const [daily, statusCounts, byRoute, byBus] = await Promise.all([
    Booking.aggregate([
      { $match: active },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 }, seats: { $sum: { $size: "$selectedSeats" } } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$totalPrice" } } }]),
    Booking.aggregate([
      { $match: active },
      { $lookup: { from: "buses", localField: "bus", foreignField: "_id", as: "trip" } },
      { $unwind: "$trip" },
      { $group: { _id: { source: "$trip.source", destination: "$trip.destination" }, revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 }, seats: { $sum: { $size: "$selectedSeats" } } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Booking.aggregate([
      { $match: active },
      { $lookup: { from: "buses", localField: "bus", foreignField: "_id", as: "trip" } },
      { $unwind: "$trip" },
      { $group: { _id: { name: "$trip.busName", number: "$trip.busNumber" }, revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const totals = daily.reduce((t, d) => ({ revenue: t.revenue + d.revenue, bookings: t.bookings + d.bookings, seats: t.seats + d.seats }), { revenue: 0, bookings: 0, seats: 0 });

  res.json({
    range: { from: start, to: end },
    totals,
    daily: daily.map((d) => ({ date: d._id, revenue: d.revenue, bookings: d.bookings, seats: d.seats })),
    statusCounts: statusCounts.map((s) => ({ status: s._id, count: s.count, amount: s.amount })),
    byRoute: byRoute.map((r) => ({ route: `${r._id.source} → ${r._id.destination}`, revenue: r.revenue, bookings: r.bookings, seats: r.seats })),
    byBus: byBus.map((b) => ({ bus: `${b._id.name} (${b._id.number})`, revenue: b.revenue, bookings: b.bookings })),
  });
});

module.exports = {
  dashboard, listBuses, createBus, updateBus, deleteBus,
  listRoutes, createRoute, updateRoute, deleteRoute,
  listSchedules, createSchedules, updateSchedule, updateScheduleStatus, cancelSchedule, deleteSchedule,
  listUsers, createStaff, updateUserRole,
  listBookings, cancelBooking, updateBookingStatus, reports,
};
