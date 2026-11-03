// Run once:  node seedStaff.js
// Creates demo admin + operators, builds Routes / Fleet from your existing
// bus schedules, links them, and assigns fleet buses to operators.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Bus = require("./models/Bus");
const FleetBus = require("./models/FleetBus");
const Route = require("./models/Route");

const MONGO_URI = "mongodb://127.0.0.1:27017/bus_ticket_booking";

const STAFF = [
  { name: "BusGo Admin", email: "admin@busgo.com", password: "Admin@123", role: "admin" },
  { name: "Ravi Operator", email: "operator1@busgo.com", password: "Operator@123", role: "operator" },
  { name: "Meena Operator", email: "operator2@busgo.com", password: "Operator@123", role: "operator" },
];

async function run() {
  await mongoose.connect(MONGO_URI);

  const operators = [];
  for (const s of STAFF) {
    let user = await User.findOne({ email: s.email });
    if (!user) {
      user = await User.create({ ...s, password: await bcrypt.hash(s.password, 12) });
      console.log(`Created ${s.role}: ${s.email} / ${s.password}`);
    } else if (user.role !== s.role) {
      user.role = s.role;
      await user.save();
      console.log(`Updated role for ${s.email} -> ${s.role}`);
    }
    if (s.role === "operator") operators.push(user);
  }

  // Routes from existing schedules
  const pairs = await Bus.aggregate([{ $group: { _id: { source: "$source", destination: "$destination" } } }]);
  for (const p of pairs) {
    const route = await Route.findOneAndUpdate(
      { source: p._id.source, destination: p._id.destination },
      { $setOnInsert: { source: p._id.source, destination: p._id.destination } },
      { upsert: true, new: true }
    );
    await Bus.updateMany({ source: p._id.source, destination: p._id.destination, route: null }, { route: route._id });
  }

  // Fleet buses from existing schedules
  const distinct = await Bus.aggregate([
    { $group: { _id: "$busNumber", doc: { $first: "$$ROOT" } } },
  ]);
  let i = 0;
  for (const d of distinct) {
    const b = d.doc;
    const fleet = await FleetBus.findOneAndUpdate(
      { busNumber: b.busNumber.toUpperCase() },
      {
        $setOnInsert: {
          busName: b.busName,
          busNumber: b.busNumber.toUpperCase(),
          operator: b.operator,
          busType: b.busType,
          totalSeats: b.totalSeats,
          assignedOperator: operators.length ? operators[i % operators.length]._id : null,
        },
      },
      { upsert: true, new: true }
    );
    await Bus.updateMany({ busNumber: b.busNumber, fleetBus: null }, { fleetBus: fleet._id });
    i++;
  }

  console.log(`Routes: ${await Route.countDocuments()}, Fleet buses: ${await FleetBus.countDocuments()}`);
  console.log("Done. Log in to the admin app with admin@busgo.com / Admin@123");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
