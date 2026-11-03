
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("busgoToken", data.token);
      localStorage.setItem("busgoUser", JSON.stringify(data.user));

      navigate(location.state?.from || "/dashboard", { replace: true });
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

        <h1>Welcome Back!</h1>
        <p className="auth-subtitle">Log in to manage your bus journeys.</p>

        {message && <div className="auth-message">{message}</div>}

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
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <Link className="back-home" to="/">← Back to Home</Link>
      </form>
    </div>
  );
}

export default Login;
