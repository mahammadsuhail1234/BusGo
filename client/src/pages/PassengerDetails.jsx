
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./PassengerDetails.css";

function PassengerDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const bus = location.state?.bus;
  const selectedSeats = location.state?.selectedSeats || [];

  const totalPrice =
    location.state?.totalPrice ??
    selectedSeats.length * Number(bus?.price || 0);
  const token = localStorage.getItem("busgoToken");

  const [passengers, setPassengers] = useState(
    selectedSeats.map(() => ({
      name: "",
      age: "",
      gender: "",
    }))
  );

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updatePassenger(index, field, value) {
    setPassengers((current) =>
      current.map((passenger, i) =>
        i === index
          ? { ...passenger, [field]: value }
          : passenger
      )
    );
  }

  async function confirmBooking(event) {
    event.preventDefault();
    setErrorMessage("");

    if (submitting) return;

    if (!/^[0-9]{10}$/.test(phone)) {
      setErrorMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    const validPassengers = passengers.every(
      (passenger) =>
        passenger.name.trim().length > 0 &&
        Number.isInteger(Number(passenger.age)) &&
        Number(passenger.age) >= 1 &&
        Number(passenger.age) <= 120 &&
        ["Male", "Female", "Other"].includes(passenger.gender)
    );

    if (!validPassengers) {
      setErrorMessage(
        "Please enter a valid name, age and gender for every passenger."
      );
      return;
    }

    if (!bus?._id || selectedSeats.length === 0) {
      setErrorMessage("Bus or seat information is missing. Please select seats again.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            busId: bus._id,
            selectedSeats,
            passengers: passengers.map((passenger) => ({
              name: passenger.name.trim(),
              age: Number(passenger.age),
              gender: passenger.gender,
            })),
            phone,
            email: email.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save your booking."
        );
      }

      if (!data.booking?._id || !data.booking?.bookingId) {
        throw new Error(
          "The server response did not contain a valid booking. Please check the backend."
        );
      }

      const booking = {
        ...data.booking,
        bus,
        selectedSeats: data.booking.selectedSeats,
        passengers: data.booking.passengers,
        phone: data.booking.phone,
        email: data.booking.email,
        totalPrice: data.booking.totalPrice,
      };

      navigate("/booking-confirmation", {
        state: { booking },
      });
    } catch (error) {
      console.error("Booking error:", error);
      setErrorMessage(
        error.message ||
          "Cannot connect to the server. Make sure your backend is running."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!bus || selectedSeats.length === 0) {
    return (
      <main className="passenger-page">
        <h2>No seats selected</h2>
        <p>Please select a bus and seats first.</p>
        <Link to="/">Back to Bus Search</Link>
      </main>
    );
  }

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname, state: location.state } }}
      />
    );
  }

  return (
    <div className="passenger-page">
      <header className="passenger-header">
        <Link to="/" className="passenger-logo">
          BusGo<span>.</span>
        </Link>

        <Link to="/" className="passenger-back">
          Back to Search
        </Link>
      </header>

      <main className="passenger-content">
        <h1>Passenger Details</h1>

        <p className="passenger-subtitle">
          Enter the details of everyone travelling.
        </p>

        <section className="passenger-trip-card">
          <h2>{bus.busName || "Bus"}</h2>
          <p>
            {bus.source} → {bus.destination}
          </p>
          <p>
            {bus.departureTime} – {bus.arrivalTime}
          </p>
          <p>
            Travel date: {bus.travelDate || "Not provided"}
          </p>
          <p>Selected seats: {selectedSeats.join(", ")}</p>
          <h3>
            Total: ₹{Number(totalPrice).toLocaleString("en-IN")}
          </h3>
        </section>

        <form
          className="passenger-form"
          onSubmit={confirmBooking}
        >
          <h2>Contact Information</h2>

          <label htmlFor="phone">Mobile number *</label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />

          <label htmlFor="email">Email (optional)</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <h2>Passenger Information</h2>

          {passengers.map((passenger, index) => (
            <section
              className="passenger-person"
              key={selectedSeats[index]}
            >
              <h3>
                Passenger {index + 1} — Seat {selectedSeats[index]}
              </h3>

              <label htmlFor={`name-${index}`}>
                Full name *
              </label>
              <input
                id={`name-${index}`}
                type="text"
                autoComplete="name"
                value={passenger.name}
                onChange={(event) =>
                  updatePassenger(index, "name", event.target.value)
                }
                required
              />

              <label htmlFor={`age-${index}`}>Age *</label>
              <input
                id={`age-${index}`}
                type="number"
                min="1"
                max="120"
                step="1"
                value={passenger.age}
                onChange={(event) =>
                  updatePassenger(index, "age", event.target.value)
                }
                required
              />

              <label htmlFor={`gender-${index}`}>
                Gender *
              </label>
              <select
                id={`gender-${index}`}
                value={passenger.gender}
                onChange={(event) =>
                  updatePassenger(index, "gender", event.target.value)
                }
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </section>
          ))}

          <div className="passenger-total">
            <span>Total fare</span>
            <strong>
              ₹{Number(totalPrice).toLocaleString("en-IN")}
            </strong>
          </div>

          {errorMessage && (
            <p role="alert" className="passenger-error">
              {errorMessage}
            </p>
          )}

          <button
            className="passenger-confirm-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Saving Booking..."
              : "Continue to Confirmation →"}
          </button>

          <p className="passenger-disclaimer">
            Your booking details will be sent to the server.
            The booking remains pending until the system confirms it.
          </p>
        </form>
      </main>
    </div>
  );
}

export default PassengerDetails;
