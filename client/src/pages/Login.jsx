
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../config";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(api("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      localStorage.setItem("token", data.token);

      alert("Login successful!");

      navigate("/dashboard");

      console.log(data);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>MediaVault</h1>

        <p className="login-subtitle">
          Private Media Storage & Sharing
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            className="login-button"
            type="submit"
          >
            Login
          </button>
        </form>

        <div className="register-section">
          <p>Don't have an account?</p>

          <button
            className="register-button"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

