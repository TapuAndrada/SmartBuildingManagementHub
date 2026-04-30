import React, { useState } from "react";
import "./App.css";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [token, setToken] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const handleLogin = (token, email) => {
    setToken(token);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setToken("");
    setUserEmail("");
  };

  return (
    <div className="app">
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard token={token} email={userEmail} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
