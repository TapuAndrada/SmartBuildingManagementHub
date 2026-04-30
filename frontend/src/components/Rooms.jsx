import React, { useEffect, useState } from "react";
import {
  getRooms,
  getSensors,
  getRoomTotalEnergy,
  createDevice,
} from "../api/api";

function Rooms({ token, devices,setDevices, handleToggleDevice }) {
  const [rooms, setRooms] = useState([]);
  const [sensorsByRoom, setSensorsByRoom] = useState({});
  const [energyByRoom, setEnergyByRoom] = useState({});
  const [showAddDeviceRoomId, setShowAddDeviceRoomId] = useState(null);
const [deviceName, setDeviceName] = useState("");
const [deviceType, setDeviceType] = useState("Light");
const [deviceStatus, setDeviceStatus] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomsData = await getRooms(token);
        

        const safeRooms = Array.isArray(roomsData) ? roomsData : [];
        

        setRooms(safeRooms);
      

        for (const room of safeRooms) {
          try {
            const sensorData = await getSensors(token, room.id);
            const energyData = await getRoomTotalEnergy(token, room.id);

            setSensorsByRoom((prev) => ({
              ...prev,
              [room.id]: sensorData,
            }));

            setEnergyByRoom((prev) => ({
              ...prev,
              [room.id]: energyData,
            }));
          } catch (error) {
            console.error(`Eroare la datele camerei ${room.id}:`, error);
          }
        }
      } catch (error) {
        console.error("Eroare rooms:", error);
      }
    };

    fetchData();
  }, [token]);

  const handleTurnOffRoom = async (roomDevices) => {
  const activeDevices = roomDevices.filter((device) => device.is_on);

  for (const device of activeDevices) {
    await handleToggleDevice(device);
  }
};

const handleAddDevice = async (e, roomId) => {
  e.preventDefault();

  if (!deviceName.trim()) {
    alert("Please enter device name.");
    return;
  }

  try {
    const newDevice = await createDevice(token, {
      name: deviceName,
      device_type: deviceType,
      room_id: roomId,
      is_on: deviceStatus,
      settings: {},
    });

    setDevices((prev) => [...prev, newDevice]);

    setDeviceName("");
    setDeviceType("Light");
    setDeviceStatus(false);
    setShowAddDeviceRoomId(null);
  } catch (error) {
    console.error("Eroare la adăugarea device-ului:", error);
    alert("Device could not be created.");
  }
};

  return (
  <div>
    <div className="section-header">
      <h1>Rooms Control</h1>
      <p>Manage each room, monitor sensors and control connected devices.</p>
    </div>

    <div className="rooms-grid">
      {rooms.map((room) => {
        const roomDevices = (devices || []).filter(
          (device) => device.room_id === room.id
        );

        const sensor = sensorsByRoom[room.id];
        const energy = energyByRoom[room.id];

        return (
          <div className="room-card room-control-card" key={room.id}>
            <div className="room-card-header">
              <div>
                <h3>{room.name}</h3>
                <p>Floor {room.floor}</p>
              </div>

              <span className="room-status-badge">
                {roomDevices.some((device) => device.is_on)
                  ? "Active"
                  : "All Off"}
              </span>
            </div>

            <div className="room-info">
              <div>
                <span>Temperature</span>
                <strong>{sensor?.temperature ?? "--"}°C</strong>
              </div>

              <div>
                <span>Humidity</span>
                <strong>{sensor?.humidity ?? "--"}%</strong>
              </div>

              <div>
                <span>Energy</span>
                <strong>{energy?.total_kwh ?? "--"} kWh</strong>
              </div>
            </div>

            <h4 className="devices-title">Devices</h4>

{roomDevices.length === 0 ? (
  <p className="empty-devices">No devices in this room.</p>
) : (
  <div className="devices-list">
    {roomDevices.map((device) => (
      <div className="device-control" key={device.id}>
        <div>
          <strong>{device.name}</strong>
          <p>{device.device_type}</p>
        </div>

        <button
          className={device.is_on ? "toggle-on" : "toggle-off"}
          onClick={() => handleToggleDevice(device)}
        >
          {device.is_on ? "ON" : "OFF"}
        </button>
      </div>
    ))}
  </div>
)}

{/* 🔴 TURN OFF ROOM */}
{roomDevices.some((device) => device.is_on) && (
  <button
    className="turn-off-room-btn"
    onClick={() => handleTurnOffRoom(roomDevices)}
  >
    Turn off room
  </button>
)}

{/* 🔵 ADD DEVICE BUTTON */}
<button
  className="add-device-btn"
  onClick={() =>
    setShowAddDeviceRoomId(
      showAddDeviceRoomId === room.id ? null : room.id
    )
  }
>
  + Add Device
</button>

{/* 🟣 ADD DEVICE FORM */}
{showAddDeviceRoomId === room.id && (
  <form
    className="add-device-form"
    onSubmit={(e) => handleAddDevice(e, room.id)}
  >
    <input
      type="text"
      placeholder="Device name"
      value={deviceName}
      onChange={(e) => setDeviceName(e.target.value)}
    />

    <select
      value={deviceType}
      onChange={(e) => setDeviceType(e.target.value)}
    >
      <option value="Light">Light</option>
      <option value="AC">AC</option>
       <option value="Humidifier">Humidifier</option>
    </select>

    <select
      value={deviceStatus ? "ON" : "OFF"}
      onChange={(e) => setDeviceStatus(e.target.value === "ON")}
    >
      <option value="OFF">OFF</option>
      <option value="ON">ON</option>
    </select>

    <button type="submit">Save</button>
  </form>
)}
          </div>
        );
      })}
    </div>
  </div>
);
}

export default Rooms;