
const mongoose = require("mongoose");
const Bus = require("./models/Bus");

const MONGO_URI =
  "mongodb://127.0.0.1:27017/bus_ticket_booking";

const routes = [
  {
    source: "Mangalore",
    destination: "Puttur",
    buses: [
      {
        busName: "Coastal Express",
        busNumber: "KA19AB1001",
        operator: "Coastal Travels",
        departureTime: "08:00 AM",
        arrivalTime: "10:00 AM",
        price: 180,
        totalSeats: 40,
        busType: "AC Seater",
      },
      {
        busName: "Western Ghats Travels",
        busNumber: "KA19CD1002",
        operator: "Western Ghats Travels",
        departureTime: "02:00 PM",
        arrivalTime: "04:00 PM",
        price: 220,
        totalSeats: 36,
        busType: "AC Sleeper",
      },
    ],
  },
  {
    source: "Puttur",
    destination: "Mangalore",
    buses: [
      {
        busName: "City Link",
        busNumber: "KA19EF1003",
        operator: "City Link Travels",
        departureTime: "09:00 AM",
        arrivalTime: "11:00 AM",
        price: 160,
        totalSeats: 40,
        busType: "Non-AC Seater",
      },
      {
        busName: "Coastal Return",
        busNumber: "KA19GH1004",
        operator: "Coastal Travels",
        departureTime: "05:00 PM",
        arrivalTime: "07:00 PM",
        price: 190,
        totalSeats: 40,
        busType: "AC Seater",
      },
    ],
  },
  {
    source: "Mangalore",
    destination: "Bangalore",
    buses: [
      {
        busName: "Night Rider",
        busNumber: "KA19IJ1005",
        operator: "South Coast Travels",
        departureTime: "09:00 PM",
        arrivalTime: "06:00 AM",
        price: 750,
        totalSeats: 36,
        busType: "AC Sleeper",
      },
      {
        busName: "Green Line",
        busNumber: "KA19KL1006",
        operator: "Green Line Travels",
        departureTime: "08:00 PM",
        arrivalTime: "05:00 AM",
        price: 650,
        totalSeats: 40,
        busType: "AC Seater",
      },
    ],
  },
  {
    source: "Bangalore",
    destination: "Mangalore",
    buses: [
      {
        busName: "Coastal Night Express",
        busNumber: "KA19MN1007",
        operator: "Coastal Travels",
        departureTime: "09:30 PM",
        arrivalTime: "06:30 AM",
        price: 700,
        totalSeats: 36,
        busType: "AC Sleeper",
      },
    ],
  },
  {
    source: "Mangalore",
    destination: "Mysore",
    buses: [
      {
        busName: "Mysore Express",
        busNumber: "KA19OP1008",
        operator: "Mysore Travels",
        departureTime: "07:00 AM",
        arrivalTime: "01:00 PM",
        price: 450,
        totalSeats: 40,
        busType: "AC Seater",
      },
    ],
  },
  {
    source: "Mysore",
    destination: "Mangalore",
    buses: [
      {
        busName: "Malnad Express",
        busNumber: "KA19QR1009",
        operator: "Malnad Travels",
        departureTime: "02:00 PM",
        arrivalTime: "08:00 PM",
        price: 470,
        totalSeats: 40,
        busType: "AC Seater",
      },
    ],
  },
  {
    source: "Mangalore",
    destination: "Udupi",
    buses: [
      {
        busName: "Coastal Connect",
        busNumber: "KA19ST1010",
        operator: "Coastal Travels",
        departureTime: "10:00 AM",
        arrivalTime: "12:00 PM",
        price: 200,
        totalSeats: 40,
        busType: "Non-AC Seater",
      },
    ],
  },
  {
    source: "Udupi",
    destination: "Mangalore",
    buses: [
      {
        busName: "Coastal Return Express",
        busNumber: "KA19UV1011",
        operator: "Coastal Travels",
        departureTime: "03:00 PM",
        arrivalTime: "05:00 PM",
        price: 210,
        totalSeats: 40,
        busType: "AC Seater",
      },
    ],
  },
  {
    source: "Bangalore",
    destination: "Mysore",
    buses: [
      {
        busName: "Royal City Express",
        busNumber: "KA19WX1012",
        operator: "Royal City Travels",
        departureTime: "08:00 AM",
        arrivalTime: "11:00 AM",
        price: 300,
        totalSeats: 40,
        busType: "AC Seater",
      },
    ],
  },
  {
    source: "Mysore",
    destination: "Bangalore",
    buses: [
      {
        busName: "Royal Return",
        busNumber: "KA19YZ1013",
        operator: "Royal City Travels",
        departureTime: "04:00 PM",
        arrivalTime: "07:00 PM",
        price: 320,
        totalSeats: 40,
        busType: "AC Seater",
      },
    ],
  },
];

async function seedBuses() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected!");

    // Collect every sample bus number from the routes above.
    const sampleBusNumbers = routes.flatMap((route) =>
      route.buses.map((bus) => bus.busNumber)
    );

    // Remove only these sample bus records before reseeding.
    await Bus.deleteMany({
      busNumber: { $in: sampleBusNumbers },
    });

    const busesToInsert = [];
    const today = new Date();

    // Create one schedule per bus per day for 30 days.
    for (let day = 0; day < 30; day++) {
      const travelDate = new Date(today);
      travelDate.setDate(today.getDate() + day);

      const dateString = [
        travelDate.getFullYear(),
        String(travelDate.getMonth() + 1).padStart(2, "0"),
        String(travelDate.getDate()).padStart(2, "0"),
      ].join("-");

      for (const route of routes) {
        for (const bus of route.buses) {
          busesToInsert.push({
            ...bus,
            source: route.source,
            destination: route.destination,
            travelDate: dateString,
            availableSeats: bus.totalSeats,
            status: "scheduled",
          });
        }
      }
    }

    await Bus.insertMany(busesToInsert);

    console.log(
      `Successfully added ${busesToInsert.length} bus schedules!`
    );
    console.log("Routes: Mangalore, Puttur, Bangalore, Mysore and Udupi");
    console.log("Schedules cover today and the next 29 days.");
  } catch (error) {
    console.error("Bus seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedBuses();
