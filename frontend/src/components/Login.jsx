import React, { useState } from "react";
import { loginUser } from "../api/api";

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); 

    try {
      const data = await loginUser(email, password);

      if (data.access_token) {
        onLogin(data.access_token, email);
      }
    } catch (error) {
      console.error("Login error details:", error);

      if (error.response && error.response.status === 401) {
        setErrorMessage("Invalid credentials. Please check your email and password.");
      } else {
        setErrorMessage("Could not connect to the server. Please try again later.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Smart Hub</h1>
        <p>Log in to control the building</p>

        {errorMessage && (
          <div className="error-alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button">
            Log in
          </button>

          <p className="auth-switch-text">
            Don't have an account?{" "}
            <button 
              type="button" 
              className="btn-link"
              onClick={onSwitchToRegister} 
            >
              Register here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;