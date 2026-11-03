
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      alert("Registration successful! Please log in.");
      navigate("/login", { state: location.state });
    } catch {
      setMessage("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Link className="auth-logo" to="/">BusGo<span>.</span></Link>

        <h1>Create Account</h1>
        <p className="auth-subtitle">Join BusGo and plan your next journey.</p>

        {message && <div className="auth-message">{message}</div>}

        <label>
          Full Name
          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email Address
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            placeholder="Enter password again"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <Link className="back-home" to="/">← Back to Home</Link>
      </form>
    </div>
  );
}

export default Register;
