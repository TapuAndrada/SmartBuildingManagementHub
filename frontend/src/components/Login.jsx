import React, { useState } from "react";
import { loginUser } from "../api/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await loginUser(email, password);

      if (data.access_token) {
        onLogin(data.access_token, email);
      } else {
        alert("Login eșuat! Verifică emailul și parola.");
      }
    } catch (error) {
      console.error(error);
      alert("Nu s-a putut contacta serverul.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Smart Hub</h1>
        <p>Log in to control the building</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Parolă"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Log in</button>
        </form>
      </div>
    </div>
  );
}

export default Login;