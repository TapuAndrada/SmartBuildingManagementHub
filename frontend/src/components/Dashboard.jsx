import React, { useEffect, useState } from "react";

import { getRooms, getDevices , getSensors, getRoomTotalEnergy, updateDevice} from "../api/api";
import Rooms from "./Rooms";
import Energy from "./Energy";
import {
  LightbulbOff,  
  Cable,
  House
} from "lucide-react";
import { Thermometer, Lightbulb, Zap,  Cpu } from "lucide-react";

function Dashboard({ token, email, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());

 const fetchData = async () => {
  try {
    const roomsData = await getRooms(token);
    const devicesData = await getDevices(token);
    const sensorData = await getSensors(token, 1);
    const energyData = await getRoomTotalEnergy(token, 1);

    console.log("Devices:", devicesData);
    console.log("Energy response:", energyData);

    setRooms(Array.isArray(roomsData) ? roomsData : []);
    setDevices(Array.isArray(devicesData) ? devicesData : []);
    setSensorData(sensorData);
    setEnergyData(energyData);
  } catch (error) {
    console.error("Eroare la încărcarea datelor:", error);
  }
};

useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);
const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const activeDevices = devices.filter((device) => device.is_on === true).length;

const lights = devices.filter((device) =>
  device.device_type?.toLowerCase().includes("light")
);

const lightsOn = lights.filter((device) => device.is_on === true).length;

const averageTemperature = sensorData?.temperature ?? "--";

const totalEnergy = energyData?.total_kwh ?? "--";
const maxDailyEnergy = 10; // valoare estimativă

const handleTurnOffLights = async () => {
  const lights = devices.filter((device) =>
    device.device_type?.toLowerCase().includes("light") && device.is_on
  );

  for (const light of lights) {
    await handleToggleDevice(light);
  }
};

const handleTurnOffDevices = async () => {
  const activeDevices = devices.filter((device) => device.is_on);

  for (const device of activeDevices) {
    await handleToggleDevice(device);
  }
};

const getRoomDevices = (roomId) => {
  return devices.filter((device) => device.room_id === roomId);
};

const getRoomLightStatus = (roomId) => {
  const roomDevices = getRoomDevices(roomId);
  const light = roomDevices.find((device) =>
    device.device_type?.toLowerCase().includes("light")
  );

  if (!light) return "No light";

  return light.is_on ? "Light ON" : "Light OFF";
};

const getRoomTemperature = (roomId) => {
  if (roomId === 1 && sensorData?.temperature) {
    return `${sensorData.temperature}°C`;
  }

  return "--°C";
};

const getRoomACStatus = (roomId) => {
  const roomDevices = getRoomDevices(roomId);
  const ac = roomDevices.find((device) =>
    device.device_type?.toLowerCase().includes("ac")
  );

  if (!ac) return "AC not set";

  return ac.is_on ? "AC ON" : "AC OFF";
};

const handleToggleDevice = async (device) => {
  const newStatus = !device.is_on;

  try {
    await updateDevice(token, device.id, newStatus);

    setDevices((prev) =>
      prev.map((d) =>
        d.id === device.id ? { ...d, is_on: newStatus } : d
      )
    );
  } catch (err) {
    console.error(err);
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
    <h1>Welcome, {email?.split("@")[0]} </h1>
    <p>Here is your home status today.</p>
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

        <div className="stats">

  {/* TEMPERATURE */}
  <div className="stat-card">
    <div className="stat-header">
      <Thermometer size={18} />
      <p>Average Temperature</p>
    </div>

    <h2>
      {averageTemperature !== "--" ? `${averageTemperature}°C` : "--"}
    </h2>

    <p className="stat-sub">Based on sensor data</p>
  </div>


  {/* LIGHTS */}
  <div className="stat-card">
    <div className="stat-header">
      <Lightbulb size={18} />
      <p>Lights On</p>
    </div>

    <h2>{lightsOn}/{lights.length}</h2>

    <p className="stat-sub">Active lights in your home</p>
  </div>


  {/* DEVICES */}
  <div className="stat-card">
    <div className="stat-header">
      <Cpu size={18} />
      <p>Active Devices</p>
    </div>

    <h2>{activeDevices}</h2>

    <p className="stat-sub">Currently powered devices</p>
  </div>


  {/* ENERGY */}
  <div className="stat-card">
    <div className="stat-header">
      <Zap size={18} />
      <p>Energy Today</p>
    </div>

    <h2>{totalEnergy} kWh</h2>

<div className="energy-progress">
    <div
      className="energy-bar"
      style={{
  width: `${
    totalEnergy !== "--"
      ? Math.min((totalEnergy / maxDailyEnergy) * 100, 100)
      : 0
  }%`
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
   <button className="quick-action-btn" onClick={handleTurnOffLights}>
  <LightbulbOff size={24} />
  <span>Turn off all lights</span>
</button>

<button className="quick-action-btn" onClick={handleTurnOffDevices}>
  <Cable size={24} />
  <span>Turn off all devices</span>
</button>

  </div>
</div>
   

<div className="rooms-preview-section">
  <div className="rooms-preview-header">
    <h2>Rooms Preview</h2>
    <p>Quick overview of each room status</p>
  </div>

  <div className="rooms-preview-grid">
    {rooms.map((room) => (
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
  />
)}
       
      
        {page === "energy" && <Energy token={token} devices={devices} />}
      </main>
    </div>
  );
}

export default Dashboard;