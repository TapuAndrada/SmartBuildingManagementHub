import React, { useEffect, useState } from "react";
import {
  getSensors,
  getRoomTotalEnergy,
  createDevice,
  createRoom,
  turnOffAllInRoom,
  updateDeviceSettings,
} from "../api/api";

const DEVICE_TYPE_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "ac", label: "AC" },
  { value: "hvac", label: "HVAC" },
  { value: "tv", label: "TV" },
  { value: "humidifier", label: "Humidifier" },
  { value: "heater", label: "Heater" },
];

// Devices that have an adjustable target temperature
const TEMP_CONTROLLABLE = ["ac", "hvac", "heater"];

function Rooms({
  token,
  devices,
  setDevices,
  handleToggleDevice,
  currentUser,
  rooms,
  setRooms,
}) {
  const [sensorsByRoom, setSensorsByRoom] = useState({});
  const [energyByRoom, setEnergyByRoom] = useState({});

  // Add device form
  const [showAddDeviceRoomId, setShowAddDeviceRoomId] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("light");
  const [deviceStatus, setDeviceStatus] = useState(false);

  // Add room form (admin only)
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomFloor, setRoomFloor] = useState(1);
  const [roomTemp, setRoomTemp] = useState(22);

  const isAdmin = currentUser?.role === "admin";
  const userRoomId = currentUser?.room_id ?? null;

  const visibleRooms = isAdmin
    ? rooms
    : rooms.filter((r) => r.id === userRoomId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        for (const room of visibleRooms) {
          try {
            const sensorData = await getSensors(token, room.id);
            const energyData = await getRoomTotalEnergy(token, room.id);
            setSensorsByRoom((prev) => ({ ...prev, [room.id]: sensorData }));
            setEnergyByRoom((prev) => ({ ...prev, [room.id]: energyData }));
          } catch (err) {
            console.error(`Eroare la datele camerei ${room.id}:`, err);
          }
        }
      } catch (err) {
        console.error("Eroare rooms:", err);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, rooms, userRoomId]);

  // Used by regular user "turn off room" button (per-device toggling)
  const handleTurnOffRoom = async (roomDevices) => {
    const activeDevices = roomDevices.filter((d) => d.is_on);
    for (const device of activeDevices) {
      await handleToggleDevice(device);
    }
  };

  // Used by admin "turn off all" button (single bulk endpoint)
  const handleAdminTurnOffRoom = async (roomId) => {
    try {
      const result = await turnOffAllInRoom(token, roomId);
      if (Array.isArray(result.devices_turned_off)) {
        setDevices((prev) =>
          prev.map((d) =>
            result.devices_turned_off.includes(d.id)
              ? { ...d, is_on: false }
              : d
          )
        );
      }
    } catch (err) {
      console.error("Failed to turn off room:", err);
      alert("Could not turn off room.");
    }
  };

  const handleAddDevice = async (e, roomId) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      alert("Please enter a device name.");
      return;
    }

    const settings = TEMP_CONTROLLABLE.includes(deviceType)
      ? { target_temp: 22 }
      : deviceType === "light"
      ? { brightness: 80 }
      : {};

    try {
      const newDevice = await createDevice(token, {
        name: deviceName,
        device_type: deviceType,
        room_id: roomId,
        is_on: deviceStatus,
        settings,
      });
      setDevices((prev) => [...prev, newDevice]);
      setDeviceName("");
      setDeviceType("light");
      setDeviceStatus(false);
      setShowAddDeviceRoomId(null);
    } catch (err) {
      console.error("Eroare la adăugarea device-ului:", err);
      alert("Device could not be created.");
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      alert("Please enter a room name.");
      return;
    }
    try {
      const newRoom = await createRoom(token, {
        name: roomName,
        floor: parseInt(roomFloor, 10) || 1,
        target_temperature: parseFloat(roomTemp) || 22,
      });
      setRooms((prev) => [...prev, newRoom]);
      setRoomName("");
      setRoomFloor(1);
      setRoomTemp(22);
      setShowAddRoom(false);
    } catch (err) {
      console.error("Eroare la adăugarea camerei:", err);
      alert("Room could not be created.");
    }
  };

  const handleTargetTempChange = async (device, newTemp) => {
    // Optimistic update
    setDevices((prev) =>
      prev.map((d) =>
        d.id === device.id
          ? { ...d, settings: { ...(d.settings || {}), target_temp: newTemp } }
          : d
      )
    );
    try {
      await updateDeviceSettings(token, device.id, { target_temp: newTemp });
    } catch (err) {
      console.error("Failed to update target temp:", err);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1>Rooms Control</h1>
        <p>Manage each room, monitor sensors and control connected devices.</p>
      </div>

      {/* ADMIN: Add Room */}
      {isAdmin && (
        <div className="add-room-bar">
          <button
            className="add-device-btn"
            style={{ maxWidth: 220 }}
            onClick={() => setShowAddRoom((v) => !v)}
          >
            {showAddRoom ? "Cancel" : "+ Add Room"}
          </button>

          {showAddRoom && (
            <form className="add-device-form" onSubmit={handleAddRoom}>
              <input
                type="text"
                placeholder="Room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Floor"
                value={roomFloor}
                onChange={(e) => setRoomFloor(e.target.value)}
              />
              <input
                type="number"
                step="0.5"
                placeholder="Target °C"
                value={roomTemp}
                onChange={(e) => setRoomTemp(e.target.value)}
              />
              <button type="submit">Save Room</button>
            </form>
          )}
        </div>
      )}

      <div className="rooms-grid">
        {visibleRooms.map((room) => {
          const roomDevices = (devices || []).filter(
            (d) => d.room_id === room.id
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
                  {roomDevices.some((d) => d.is_on) ? "Active" : "All Off"}
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
                  {roomDevices.map((device) => {
                    const canControl = isAdmin || room.id === userRoomId;
                    const showTempSlider =
                      TEMP_CONTROLLABLE.includes(
                        device.device_type?.toLowerCase()
                      ) && device.is_on;
                    const targetTemp = device.settings?.target_temp ?? 22;

                    return (
                      <div className="device-control" key={device.id}>
                        <div style={{ flex: 1 }}>
                          <strong>{device.name}</strong>
                          <p>{device.device_type}</p>

                          {showTempSlider && canControl && (
                            <div className="device-temp-control">
                              <span>Target: {targetTemp}°C</span>
                              <input
                                type="range"
                                min="16"
                                max="30"
                                step="1"
                                value={targetTemp}
                                onChange={(e) =>
                                  handleTargetTempChange(
                                    device,
                                    parseInt(e.target.value, 10)
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>

                        <button
                          className={device.is_on ? "toggle-on" : "toggle-off"}
                          onClick={() =>
                            canControl && handleToggleDevice(device)
                          }
                          disabled={!canControl}
                        >
                          {device.is_on ? "ON" : "OFF"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* USER: turn off own room */}
              {!isAdmin &&
                room.id === userRoomId &&
                roomDevices.some((d) => d.is_on) && (
                  <button
                    className="turn-off-room-btn"
                    onClick={() => handleTurnOffRoom(roomDevices)}
                  >
                    Turn off room
                  </button>
                )}

              {/* ADMIN: turn off any room */}
              {isAdmin && roomDevices.some((d) => d.is_on) && (
                <button
                  className="turn-off-room-btn"
                  onClick={() => handleAdminTurnOffRoom(room.id)}
                >
                  Turn off all (Admin)
                </button>
              )}

              {/* ADMIN: + Add Device */}
              {isAdmin && (
                <>
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
                        {DEVICE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={deviceStatus ? "ON" : "OFF"}
                        onChange={(e) =>
                          setDeviceStatus(e.target.value === "ON")
                        }
                      >
                        <option value="OFF">OFF</option>
                        <option value="ON">ON</option>
                      </select>
                      <button type="submit">Save</button>
                    </form>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {visibleRooms.length === 0 && (
        <p style={{ color: "#94a3b8", marginTop: 20 }}>
          {isAdmin
            ? "No rooms exist yet. Create one above."
            : "You haven't been assigned to a room yet. Pick one from the Dashboard."}
        </p>
      )}
    </div>
  );
}

export default Rooms;