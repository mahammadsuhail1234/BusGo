
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate
} from "react-router-dom";

import "./App.css";
import "./storefront.css";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SeatSelection from "./pages/SeatSelection";
import PassengerDetails from "./pages/PassengerDetails";
import BookingConfirmation from "./pages/BookingConfirmation";

function HomePage() {
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const [buses, setBuses] = useState([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState("");
  const signedIn = Boolean(localStorage.getItem("busgoToken"));

  useEffect(() => {
    let active = true;

    async function loadLocations() {
      try {
        const response = await fetch("http://localhost:5000/api/buses/locations");
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load locations.");
        if (active) setLocations(data.locations || []);
      } catch (error) {
        if (active) setLocationsError(error.message || "Unable to load locations.");
      } finally {
        if (active) setLocationsLoading(false);
      }
    }

    loadLocations();
    return () => { active = false; };
  }, []);

  function chooseBus(bus) {
    if (!localStorage.getItem("busgoToken")) {
      navigate("/login", {
        state: { from: { pathname: "/select-seats", state: { bus } } },
      });
      return;
    }

    navigate("/select-seats", { state: { bus } });
  }

  async function searchBuses(event) {
    event.preventDefault();

    if (!from || !to || !date) {
      setSearchMessage(
        "Please select your source, destination and travel date."
      );
      setBuses([]);
      return;
    }

    if (from === to) {
      setSearchMessage("Source and destination must be different.");
      setBuses([]);
      return;
    }

    setBuses([]);
    setSearchMessage("");
    setSearching(true);

    try {
      const params = new URLSearchParams({
        source: from,
        destination: to,
        date
      });

      const response = await fetch(
        `http://localhost:5000/api/buses/search?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Bus search failed.");
      }

      setBuses(data.buses || []);

      if (!data.buses || data.buses.length === 0) {
        setSearchMessage("No buses found for this route and date.");
      }
    } catch (error) {
      setSearchMessage(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <Link className="logo" to="/">
          <span className="brand-mark">B</span>BusGo<span className="brand-dot">.</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Find a ride</Link>
          <a href="#services">Why BusGo</a>
          {signedIn ? (
            <Link className="login-btn" to="/dashboard">My account</Link>
          ) : (
            <Link className="login-btn" to="/login">Sign in</Link>
          )}
        </div>
      </nav>

      <main id="home">
        {/* Hero and search form */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-copy">
              <p className="tagline">THE BETTER WAY TO GET THERE</p>
              <h1>Take the scenic <em>route.</em></h1>
              <p className="hero-description">
                Find your seat, settle in, and let the miles unfold. Your next journey starts here.
              </p>
              <div className="hero-perks">
                <span><i>01</i> Easy booking</span>
                <span><i>02</i> Your seat, your choice</span>
              </div>
            </div>

            <div className="search-card">
              <div className="search-heading">
                <div>
                  <p className="search-kicker">PLAN YOUR TRIP</p>
                  <h2>Where are you headed?</h2>
                </div>
                <span className="search-step">01 / 03</span>
              </div>

              <form onSubmit={searchBuses}>
                <div className="form-grid">
                  <label>
                    <span>Leaving from</span>
                    <select
                      value={from}
                      onChange={(event) => setFrom(event.target.value)}
                      required
                    >
                      <option value="">{locationsLoading ? "Loading locations..." : "Select source"}</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Going to</span>
                    <select
                      value={to}
                      onChange={(event) => setTo(event.target.value)}
                      required
                    >
                      <option value="">{locationsLoading ? "Loading locations..." : "Select destination"}</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Travel date</span>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toLocaleDateString("en-CA")}
                      onChange={(event) => setDate(event.target.value)}
                      required
                    />
                  </label>

                  <button
                    className="search-btn"
                    type="submit"
                    disabled={searching || locationsLoading || locations.length < 2}
                  >
                    {searching ? "Finding rides..." : "Search buses"}
                    {!searching && <span aria-hidden="true">→</span>}
                  </button>
                </div>
                {locationsError && <p className="location-error" role="alert">{locationsError}</p>}
                {!locationsLoading && !locationsError && locations.length < 2 && (
                  <p className="location-error">No active routes are available yet.</p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Search results */}
        {(buses.length > 0 || searchMessage || searching) && (
          <section className="bus-results">
            <div className="results-heading">
              <div>
                <p className="results-kicker">YOUR OPTIONS</p>
                <h2>Available rides <span>({buses.length})</span></h2>
              </div>
              {from && to && date && (
                <p className="results-route">{from} <span>→</span> {to} <i>·</i> {date}</p>
              )}
            </div>

            {searching && <p className="search-message">Finding the best rides for you...</p>}

            {!searching && searchMessage && (
              <p className="search-message">{searchMessage}</p>
            )}

            {!searching &&
              buses.map((bus) => (
                <article className="bus-result-card" key={bus._id}>
                  <div className="bus-card-topline">
                    <div className="bus-company">
                      <span className="bus-mark">BG</span>
                      <div>
                        <h3>{bus.busName}</h3>
                        <p>{bus.busNumber} <span>·</span> {bus.busType}</p>
                      </div>
                    </div>
                    <span className="bus-availability">{bus.availableSeats} seats left</span>
                  </div>

                  <div className="bus-card-route">
                    <div className="bus-stop">
                      <strong>{bus.departureTime}</strong>
                      <span>{bus.source}</span>
                    </div>
                    <div className="bus-route-rule" aria-hidden="true"><i /></div>
                    <div className="bus-stop bus-stop-end">
                      <strong>{bus.arrivalTime}</strong>
                      <span>{bus.destination}</span>
                    </div>
                  </div>

                  <div className="bus-card-bottom">
                    <span className="bus-date-label">{bus.travelDate}</span>
                    <div className="bus-fare"><span>Starting at</span><strong>₹{Number(bus.price).toLocaleString("en-IN")}</strong></div>
                    <button
                      className="search-btn"
                      type="button"
                      onClick={() => chooseBus(bus)}
                    >
                      {signedIn ? "Choose seats" : "Sign in to book"}<span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              ))}
          </section>
        )}

        {/* Features */}
        <section className="features" id="services">
          <div className="section-heading">
            <p className="tagline">WHY CHOOSE BUSGO?</p>
            <h2>Travel made simple</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">01</div>
              <h3>Easy Booking</h3>
              <p>
                Find buses and plan your trip in just a few steps.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">02</div>
              <h3>Secure Travel</h3>
              <p>
                Your account and booking information stay protected.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">03</div>
              <h3>Comfortable Journeys</h3>
              <p>
                Explore available buses and choose a trip that suits you.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="about">
        <Link className="logo" to="/">
          <span className="brand-mark">B</span>BusGo<span className="brand-dot">.</span>
        </Link>
        <p>Smart bus booking. Better journeys.</p>
        <p>© 2026 BusGo</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/select-seats" element={<SeatSelection />} />
        <Route path="/passenger-details"element={<PassengerDetails />}/>
        <Route path="/booking-confirmation"element={<BookingConfirmation />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
