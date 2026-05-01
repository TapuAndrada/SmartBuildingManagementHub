import React, { useState, useEffect } from "react";
import "./App.css";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { getMe } from "./api/api";

function App() {
  const [token, setToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch the logged-in user's role & room_id whenever the token changes
  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe(token);
        if (!cancelled) setCurrentUser(me);
      } catch (err) {
        console.error("Could not fetch current user:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogin = (token, email) => {
    setToken(token);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setToken("");
    setUserEmail("");
    setCurrentUser(null);
  };

  return (
    <div className="app">
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard
          token={token}
          email={userEmail}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;