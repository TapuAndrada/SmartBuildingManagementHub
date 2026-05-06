import React, { useState, useEffect } from "react";
import "./App.css";

import Login from "./components/Login";
import Register from "./components/Register"; // Importăm noua componentă
import Dashboard from "./components/Dashboard";
import { getMe } from "./api/api";

function App() {
 const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("login"); 

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
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    setToken(token);
    setUserEmail(email);
  };

 const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken("");
    setUserEmail("");
    setCurrentUser(null);
    setView("login");
  };

  return (
    <div className="app">
      {!token ? (
        // Dacă nu avem token, comutăm între Login și Register
        <>
          {view === "login" ? (
            <Login 
              onLogin={handleLogin} 
              onSwitchToRegister={() => setView("register")} 
            />
          ) : (
            <Register 
              onSwitchToLogin={() => setView("login")} 
            />
          )}
        </>
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