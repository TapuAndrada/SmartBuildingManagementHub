import React, { useState } from "react";
import axios from "axios";

function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: ""
  });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.post("http://127.0.0.1:8000/register", formData);
      
      setIsSuccess(true);
      setMessage("Registration successful! You can now log in and wait for admin approval.");
      
      setTimeout(() => {
        onSwitchToLogin();
      }, 10000);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Registration failed. Try again.");
      setIsSuccess(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Create Account</h1>
        <p>Join the Smart Hub network</p>

        {message && (
          <div style={{ 
            color: isSuccess ? '#155724' : '#721c24', 
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        {!isSuccess && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input type="text" name="full_name" placeholder="Full Name" onChange={handleChange} required />
            </div>
            <div className="input-group">
              <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
            </div>
            <div className="input-group">
              <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
            </div>
            <div className="input-group">
              <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
            </div>
            
            <button type="submit" className="login-button">Register</button>
          </form>
        )}

        <p style={{ marginTop: "20px", fontSize: "14px", textAlign: "center" }}>
          Already have an account?{" "}
          <button 
            type="button" 
            onClick={onSwitchToLogin}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#3498db", 
              cursor: "pointer", 
              textDecoration: "underline",
              padding: 0
            }}
          >
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;