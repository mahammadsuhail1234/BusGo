
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./SeatSelection.css";

function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const bus = location.state?.bus;

  const [selectedSeats, setSelectedSeats] = useState([]);

  if (!bus) {
    return (
      <div className="seat-page">
        <div className="seat-empty">
          <h2>No bus selected</h2>
          <p>Please search for buses and select a bus first.</p>
          <Link className="seat-primary-btn" to="/">
            Back to Bus Search
          </Link>
        </div>
      </div>
    );
  }

  const totalSeats = Number(bus.totalSeats) || 40;
  const availableSeats = Math.max(
    0,
    Math.min(totalSeats, Number(bus.availableSeats) || 0)
  );

  // The backend should provide the actual booked seat numbers.
  const bookedSeats = Array.isArray(bus.bookedSeats)
    ? bus.bookedSeats.map(String)
    : [];

  const seatNumbers = Array.from(
    { length: totalSeats },
    (_, index) => index + 1
  );

  const totalPrice = selectedSeats.length * Number(bus.price || 0);

  function toggleSeat(seatNumber) {
    const seat = String(seatNumber);

    if (bookedSeats.includes(seat)) return;

    setSelectedSeats((current) => {
      if (current.includes(seatNumber)) {
        return current.filter((item) => item !== seatNumber);
      }

      if (current.length >= availableSeats) {
        return current;
      }

      return [...current, seatNumber];
    });
  }

  function continueBooking() {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    if (!localStorage.getItem("busgoToken")) {
      navigate("/login", {
        state: {
          from: {
            pathname: "/passenger-details",
            state: { bus, selectedSeats, totalPrice },
          },
        },
      });
      return;
    }

    navigate("/passenger-details", {
      state: {
        bus,
        selectedSeats,
        totalPrice,
      },
    });
  }

  return (
    <div className="seat-page">
      <header className="seat-header">
        <Link className="seat-logo" to="/">
          BusGo<span>.</span>
        </Link>
        <Link className="seat-back-link" to="/">
          ← Back to Search
        </Link>
      </header>

      <main className="seat-content">
        <div className="seat-heading">
          <p className="seat-eyebrow">YOUR JOURNEY STARTS HERE</p>
          <h1>Select Your Seats</h1>
          <p>Choose your seats and review your booking.</p>
        </div>

        <section className="selected-bus-card">
          <div className="bus-card-top">
            <div>
              <h2>{bus.busName || "Bus"}</h2>
              <p className="bus-operator">
                {bus.operator || bus.busNumber || "Bus service"}
              </p>
            </div>
            <span className="bus-type">
              {bus.busType || "AC Seater"}
            </span>
          </div>

          <div className="bus-route">
            <div>
              <span className="route-label">FROM</span>
              <strong>{bus.source}</strong>
              <span className="route-time">{bus.departureTime}</span>
            </div>

            <div className="route-arrow">→</div>

            <div className="route-destination">
              <span className="route-label">TO</span>
              <strong>{bus.destination}</strong>
              <span className="route-time">{bus.arrivalTime}</span>
            </div>
          </div>

          {bus.travelDate && (
            <p className="bus-date">Travel date: {bus.travelDate}</p>
          )}

          <div className="bus-price-row">
            <span>Price per seat</span>
            <strong>₹{Number(bus.price || 0).toLocaleString("en-IN")}</strong>
          </div>
        </section>

        <div className="seat-main-grid">
          <section className="seat-panel">
            <div className="seat-panel-heading">
              <div>
                <h2>Choose your seats</h2>
                <p>{availableSeats} seats available</p>
              </div>
            </div>

            <div className="seat-legend">
              <span><i className="legend-box available-box" /> Available</span>
              <span><i className="legend-box selected-box" /> Selected</span>
              <span><i className="legend-box booked-box" /> Booked</span>
            </div>

            <div className="seat-bus">
              <div className="driver-area">
                <span>FRONT</span>
                <span>Driver 🚍</span>
              </div>

              <div className="seat-grid">
                {seatNumbers.map((seat) => {
                  const selected = selectedSeats.includes(seat);
                  const booked = bookedSeats.includes(String(seat));

                  return (
                    <button
                      key={seat}
                      type="button"
                      className={[
                        "seat",
                        selected ? "selected" : "",
                        booked ? "booked" : "",
                      ].filter(Boolean).join(" ")}
                      disabled={booked}
                      aria-pressed={selected}
                      aria-label={`Seat ${seat}${
                        booked ? ", booked" : selected ? ", selected" : ", available"
                      }`}
                      onClick={() => toggleSeat(seat)}
                      title={booked ? "Already booked" : `Seat ${seat}`}
                    >
                      {booked ? "×" : seat}
                    </button>
                  );
                })}
              </div>

              {bookedSeats.length === 0 && (
                <p className="seat-note">
                  Seat availability is based on the bus data currently provided.
                </p>
              )}
            </div>
          </section>

          <aside className="seat-summary">
            <h2>Booking Summary</h2>

            <div className="summary-route">
              {bus.source} → {bus.destination}
            </div>

            <div className="summary-line">
              <span>Selected seats</span>
              <strong>
                {selectedSeats.length ? selectedSeats.join(", ") : "None"}
              </strong>
            </div>

            <div className="summary-line">
              <span>Number of seats</span>
              <strong>{selectedSeats.length}</strong>
            </div>

            <div className="summary-line">
              <span>Price per seat</span>
              <strong>₹{Number(bus.price || 0)}</strong>
            </div>

            <div className="summary-total">
              <span>Total amount</span>
              <strong>₹{totalPrice.toLocaleString("en-IN")}</strong>
            </div>

            <button
              type="button"
              className="seat-primary-btn"
              onClick={continueBooking}
              disabled={selectedSeats.length === 0}
            >
              Continue to Book →
            </button>

            <p className="summary-note">
              Select at least one seat to continue.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default SeatSelection;
