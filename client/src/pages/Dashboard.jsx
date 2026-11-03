
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("busgoUser") || "null");
  const token = localStorage.getItem("busgoToken");
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        const response = await fetch("http://localhost:5000/api/bookings/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load bookings.");
        if (active) setBookings(data.bookings || []);
      } catch (error) {
        if (active) setBookingError(error.message || "Unable to load bookings.");
      } finally {
        if (active) setLoadingBookings(false);
      }
    }

    if (token) loadBookings();
    return () => { active = false; };
  }, [token]);

  function logout() {
    localStorage.removeItem("busgoToken");
    localStorage.removeItem("busgoUser");
    navigate("/login");
  }

  async function cancelBooking(booking) {
    if (!window.confirm(`Cancel booking ${booking.bookingId}?`)) return;
    setCancellingId(booking._id);
    setBookingError("");

    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${booking._id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to cancel booking.");
      setBookings((current) => current.map((item) =>
        item._id === booking._id ? { ...item, status: "Cancelled" } : item
      ));
    } catch (error) {
      setBookingError(error.message || "Unable to cancel booking.");
    } finally {
      setCancellingId("");
    }
  }

  if (!token || !user) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Please log in first</h2>
          <p>You need an account to access your dashboard.</p>
          <Link className="dashboard-button" to="/login">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <nav className="dashboard-navbar">
        <Link className="logo" to="/">
          BusGo<span>.</span>
        </Link>

        <button className="logout-btn" onClick={logout}>
          Log Out
        </button>
      </nav>

      <main className="dashboard-content">
        <p className="tagline">USER DASHBOARD</p>
        <h1>Welcome, {user.name}! 👋</h1>
        <p className="dashboard-description">
          Ready for your next journey? Manage your trips from here.
        </p>

        <div className="dashboard-grid">
          <Link to="/" className="dashboard-card">
            <div className="dashboard-icon">🚌</div>
            <h2>Search Buses</h2>
            <p>Find buses for your next journey.</p>
            <span>Search now →</span>
          </Link>

          <div className="dashboard-card">
            <div className="dashboard-icon">🎫</div>
            <h2>My Bookings</h2>
            <p>View tickets, travel details and booking status.</p>
            <a href="#my-bookings">{bookings.length} booking(s)</a>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-icon">👤</div>
            <h2>My Account</h2>
            <p>{user.email}</p>
            <span>Account active</span>
          </div>
        </div>

        <section className="my-bookings" id="my-bookings">
          <div className="my-bookings-heading">
            <div>
              <p className="tagline">TRIP HISTORY</p>
              <h2>My bookings</h2>
            </div>
            <Link to="/">Find a bus</Link>
          </div>

          {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}
          {loadingBookings && <p className="booking-empty">Loading your bookings...</p>}
          {!loadingBookings && !bookingError && bookings.length === 0 && (
            <p className="booking-empty">No bookings yet. Your tickets will appear here.</p>
          )}

          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-row" key={booking._id}>
                <div className="booking-trip">
                  <strong>{booking.bus?.source || "Trip"} → {booking.bus?.destination || ""}</strong>
                  <span>{booking.bus?.travelDate || "Date unavailable"} · {booking.bus?.departureTime || ""}</span>
                  <span>Ref {booking.bookingId} · Seat(s) {booking.selectedSeats.join(", ")}</span>
                </div>
                <div className="booking-meta">
                  <strong>₹{Number(booking.totalPrice).toLocaleString("en-IN")}</strong>
                  <span className={`booking-status ${booking.status.toLowerCase()}`}>{booking.status}</span>
                </div>
                <div className="booking-actions">
                  <button
                    type="button"
                    onClick={() => navigate("/booking-confirmation", { state: { booking } })}
                  >
                    View ticket
                  </button>
                  {booking.status !== "Cancelled" && (
                    <button
                      type="button"
                      className="cancel-booking"
                      disabled={cancellingId === booking._id}
                      onClick={() => cancelBooking(booking)}
                    >
                      {cancellingId === booking._id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
