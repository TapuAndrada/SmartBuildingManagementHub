import React, { useEffect, useState } from "react";

import {
  getRooms,
  getDevices,
  getSensors,
  getRoomTotalEnergy,
  updateDevice,
  swapMyRoom,
} from "../api/api";
import Rooms from "./Rooms";
import Energy from "./Energy";
import { LightbulbOff, Cable, House } from "lucide-react";
import { Thermometer, Lightbulb, Zap, Cpu } from "lucide-react";

function Dashboard({ token, email, currentUser, setCurrentUser, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());

  const isAdmin = currentUser?.role === "admin";
  const userRoomId = currentUser?.room_id ?? null;

  // Admin sees everything. Regular users see only their own room/devices.
  const visibleRooms = isAdmin
    ? rooms
    : rooms.filter((r) => r.id === userRoomId);

  const visibleDevices = isAdmin
    ? devices
    : devices.filter((d) => d.room_id === userRoomId);

  const fetchData = async () => {
    try {
      const roomsData = await getRooms(token);
      const devicesData = await getDevices(token);

      const safeRooms = Array.isArray(roomsData) ? roomsData : [];
      const safeDevices = Array.isArray(devicesData) ? devicesData : [];

      setRooms(safeRooms);
      setDevices(safeDevices);

      // Focal room: user's own room, or the first one for admin
      const focalRoomId = userRoomId ?? safeRooms[0]?.id;
      if (focalRoomId) {
        const sd = await getSensors(token, focalRoomId);
        const ed = await getRoomTotalEnergy(token, focalRoomId);
        setSensorData(sd);
        setEnergyData(ed);
      }
    } catch (error) {
      console.error("Eroare la încărcarea datelor:", error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const activeDevices = visibleDevices.filter((d) => d.is_on === true).length;

  const lights = visibleDevices.filter((d) =>
    d.device_type?.toLowerCase().includes("light")
  );

  const lightsOn = lights.filter((d) => d.is_on === true).length;
  const averageTemperature = sensorData?.temperature ?? "--";
  const totalEnergy = energyData?.total_kwh ?? "--";
  const maxDailyEnergy = 10;

  const handleTurnOffLights = async () => {
    const onLights = visibleDevices.filter(
      (d) => d.device_type?.toLowerCase().includes("light") && d.is_on
    );
    for (const light of onLights) {
      await handleToggleDevice(light);
    }
  };

  const handleTurnOffDevices = async () => {
    const onDevices = visibleDevices.filter((d) => d.is_on);
    for (const device of onDevices) {
      await handleToggleDevice(device);
    }
  };

  const getRoomDevices = (roomId) =>
    devices.filter((d) => d.room_id === roomId);

  const getRoomLightStatus = (roomId) => {
    const rd = getRoomDevices(roomId);
    const light = rd.find((d) =>
      d.device_type?.toLowerCase().includes("light")
    );
    if (!light) return "No light";
    return light.is_on ? "Light ON" : "Light OFF";
  };

  const getRoomTemperature = (roomId) => {
    if (sensorData && roomId === (userRoomId ?? rooms[0]?.id)) {
      return `${sensorData.temperature}°C`;
    }
    return "--°C";
  };

  const getRoomACStatus = (roomId) => {
    const rd = getRoomDevices(roomId);
    const ac = rd.find((d) => d.device_type?.toLowerCase().includes("ac"));
    if (!ac) return "AC not set";
    return ac.is_on ? "AC ON" : "AC OFF";
  };

  const handleToggleDevice = async (device) => {
    const newStatus = !device.is_on;
    try {
      await updateDevice(token, device.id, newStatus);
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, is_on: newStatus } : d))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwapRoom = async (e) => {
    const newRoomId = parseInt(e.target.value, 10);
    if (!newRoomId || newRoomId === userRoomId) return;
    try {
      const updated = await swapMyRoom(token, newRoomId);
      setCurrentUser(updated);
    } catch (err) {
      console.error("Failed to swap room:", err);
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <House size={28} />
          <span>Smart Hub</span>
        </div>

        <nav>
          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={page === "rooms" ? "active" : ""}
            onClick={() => setPage("rooms")}
          >
            Rooms
          </button>
          <button
            className={page === "energy" ? "active" : ""}
            onClick={() => setPage("energy")}
          >
            Energy
          </button>
        </nav>

        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </aside>

      <main className="content">
        {page === "dashboard" && (
          <>
            <div className="dashboard-header">
              <div className="header-left">
                <h1>
                  Welcome, {email?.split("@")[0]}{" "}
                  {currentUser?.role && (
                    <span className="role-badge">{currentUser.role}</span>
                  )}
                </h1>
                <p>
                  {isAdmin
                    ? "House overview – all rooms"
                    : "Here is your room status today."}
                </p>
              </div>

              <div className="header-right">
                <div className="date-box">
                  <span className="date-label">Date</span>
                  <strong>{formatDate(currentTime)}</strong>
                </div>
                <div className="time-box">
                  <span className="date-label">Time</span>
                  <strong>{formatTime(currentTime)}</strong>
                </div>
              </div>
            </div>

            {/* Room swap dropdown for non-admin users */}
            {!isAdmin && rooms.length > 0 && (
              <div className="room-swap-bar">
                <label htmlFor="room-swap">Your room:</label>
                <select
                  id="room-swap"
                  value={userRoomId ?? ""}
                  onChange={handleSwapRoom}
                >
                  <option value="" disabled>
                    Choose a room
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Floor {r.floor})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="stats">
              <div className="stat-card">
                <div className="stat-header">
                  <Thermometer size={18} />
                  <p>Average Temperature</p>
                </div>
                <h2>
                  {averageTemperature !== "--"
                    ? `${averageTemperature}°C`
                    : "--"}
                </h2>
                <p className="stat-sub">Based on sensor data</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <Lightbulb size={18} />
                  <p>Lights On</p>
                </div>
                <h2>
                  {lightsOn}/{lights.length}
                </h2>
                <p className="stat-sub">
                  {isAdmin ? "All lights in the house" : "Lights in your room"}
                </p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <Cpu size={18} />
                  <p>Active Devices</p>
                </div>
                <h2>{activeDevices}</h2>
                <p className="stat-sub">Currently powered devices</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <Zap size={18} />
                  <p>Energy Today</p>
                </div>
                <h2>
                  {totalEnergy !== "--" ? `${totalEnergy} kWh` : "--"}
                </h2>
                <div className="energy-progress">
                  <div
                    className="energy-bar"
                    style={{
                      width: `${
                        totalEnergy !== "--"
                          ? Math.min(
                              (totalEnergy / maxDailyEnergy) * 100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="stat-sub">Total consumption</p>
              </div>
            </div>

            <div className="quick-actions">
              <div className="quick-actions-header">
                <h2>Quick Actions</h2>
                <p>Control your home instantly</p>
              </div>

              <div className="quick-actions-grid">
                <button
                  className="quick-action-btn"
                  onClick={handleTurnOffLights}
                >
                  <LightbulbOff size={24} />
                  <span>Turn off all lights</span>
                </button>

                <button
                  className="quick-action-btn"
                  onClick={handleTurnOffDevices}
                >
                  <Cable size={24} />
                  <span>Turn off all devices</span>
                </button>
              </div>
            </div>

            <div className="rooms-preview-section">
              <div className="rooms-preview-header">
                <h2>{isAdmin ? "Rooms Preview" : "Your Room"}</h2>
                <p>Quick overview of room status</p>
              </div>

              <div className="rooms-preview-grid">
                {visibleRooms.map((room) => (
                  <div className="room-preview-card" key={room.id}>
                    <div>
                      <h3>{room.name}</h3>
                      <p className="room-floor">Floor {room.floor}</p>
                    </div>

                    <div className="room-status-line">
                      <span>{getRoomTemperature(room.id)}</span>
                      <span>{getRoomLightStatus(room.id)}</span>
                      <span>{getRoomACStatus(room.id)}</span>
                    </div>

                    <button
                      className="manage-room-btn"
                      onClick={() => setPage("rooms")}
                    >
                      Manage room
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {page === "rooms" && (
          <Rooms
            token={token}
            devices={devices}
            setDevices={setDevices}
            handleToggleDevice={handleToggleDevice}
            currentUser={currentUser}
            rooms={rooms}
            setRooms={setRooms}
          />
        )}

        {page === "energy" && (
          <Energy
            token={token}
            devices={visibleDevices}
            currentUser={currentUser}
            allRooms={rooms}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;