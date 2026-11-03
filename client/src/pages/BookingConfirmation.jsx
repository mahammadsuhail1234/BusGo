
import { Link, useLocation } from "react-router-dom";
import "./BookingConfirmation.css";

function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <main className="ticket-page">
        <section className="ticket-empty">
          <h2>No booking details found</h2>
          <p>Please select a bus and enter passenger details first.</p>
          <Link className="ticket-btn" to="/">
            Back to Bus Search
          </Link>
        </section>
      </main>
    );
  }

  function printTicket() {
    window.print();
  }

  const bus = booking.bus || {};

  return (
    <div className="ticket-page">
      <header className="ticket-header">
        <Link className="ticket-logo" to="/">
          BusGo<span>.</span>
        </Link>
        <Link to="/" className="ticket-back">
          Back to Home
        </Link>
      </header>

      <main className="ticket-content">
        <section className="ticket-success">
          <div className="ticket-success-icon">✓</div>
          <h1>Booking saved</h1>
          <p>
            Your booking is saved with reference {booking.bookingId}.
            Current status: {booking.status || "Pending"}.
          </p>
        </section>

        <section className="ticket-card" id="printable-ticket">
          <div className="ticket-card-header">
            <div>
              <h2>BusGo E-Ticket</h2>
              <p>Online Bus Ticket Booking</p>
            </div>
            <span className="ticket-status">{booking.status || "Pending"}</span>
          </div>

          <div className="ticket-booking-id">
            <span>Booking Reference</span>
            <strong>{booking.bookingId}</strong>
          </div>

          <div className="ticket-route">
            <div>
              <span>FROM</span>
              <h3>{bus.source}</h3>
              <p>{bus.departureTime}</p>
            </div>
            <div className="ticket-route-arrow">→</div>
            <div>
              <span>TO</span>
              <h3>{bus.destination}</h3>
              <p>{bus.arrivalTime}</p>
            </div>
          </div>

          <div className="ticket-info-grid">
            <div>
              <span>Bus Name</span>
              <strong>{bus.busName}</strong>
            </div>
            <div>
              <span>Bus Number</span>
              <strong>{bus.busNumber || "—"}</strong>
            </div>
            <div>
              <span>Travel Date</span>
              <strong>{bus.travelDate || "—"}</strong>
            </div>
            <div>
              <span>Seat Numbers</span>
              <strong>{booking.selectedSeats.join(", ")}</strong>
            </div>
            <div>
              <span>Mobile Number</span>
              <strong>{booking.phone}</strong>
            </div>
            <div>
              <span>Passengers</span>
              <strong>{booking.passengers.length}</strong>
            </div>
          </div>

          <div className="ticket-passengers">
            <h3>Passenger Details</h3>

            {booking.passengers.map((passenger, index) => (
              <div className="ticket-passenger" key={index}>
                <div>
                  <strong>{passenger.name}</strong>
                  <p>
                    Age: {passenger.age} · {passenger.gender}
                  </p>
                </div>
                <span>Seat {booking.selectedSeats[index]}</span>
              </div>
            ))}
          </div>

          <div className="ticket-total">
            <span>Total Fare</span>
            <strong>₹{Number(booking.totalPrice).toLocaleString("en-IN")}</strong>
          </div>

          <p className="ticket-disclaimer">
            This ticket reflects the booking status shown above. Keep your
            booking reference available when travelling.
          </p>
        </section>

        <div className="ticket-actions">
          <button className="ticket-btn" onClick={printTicket} type="button">
            Download / Print Ticket
          </button>

          <Link className="ticket-secondary-btn" to="/">
            Book Another Bus
          </Link>
        </div>
      </main>
    </div>
  );
}

export default BookingConfirmation;
