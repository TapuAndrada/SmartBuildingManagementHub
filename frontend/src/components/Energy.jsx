import React, { useEffect, useState } from "react";
import {
  getRooms,
  getRoomTotalEnergy,
  getDeviceTotalEnergy,
} from "../api/api";


function Energy({ token, devices }) {
  const [rooms, setRooms] = useState([]);
  const [energyByRoom, setEnergyByRoom] = useState({});
  const [energyByDevice, setEnergyByDevice] = useState({});

  useEffect(() => {
 const fetchData = async () => {
  try {
    const roomsData = await getRooms(token);
  
    const safeRooms = Array.isArray(roomsData) ? roomsData : [];
  
    setRooms(safeRooms);

    for (const room of safeRooms) {
      const energy = await getRoomTotalEnergy(token, room.id);

      setEnergyByRoom((prev) => ({
        ...prev,
        [room.id]: energy?.total_kwh || 0,
      }));
    }

    for (const device of devices || []) {
      const energy = await getDeviceTotalEnergy(token, device.id);

      setEnergyByDevice((prev) => ({
        ...prev,
        [device.id]: energy?.total_kwh || 0,
      }));
    }
  } catch (err) {
    console.error(err);
  }
};

fetchData();
}, [token, devices]);

  //  CALC

  const totalEnergy = Object.values(energyByRoom).reduce(
    (sum, val) => sum + val,
    0
  );

  const activeDevices = devices.filter((d) => d.is_on).length;

  let highestRoom = "N/A";
  let maxEnergy = 0;

  rooms.forEach((room) => {
    const energy = energyByRoom[room.id] || 0;
    if (energy > maxEnergy) {
      maxEnergy = energy;
      highestRoom = room.name;
    }
  });

const topDevices = [...devices]
  .map((device) => ({
    ...device,
    energy: energyByDevice[device.id] || 0,
  }))
  .sort((a, b) => b.energy - a.energy)
  .slice(0, 3);
 

  return (
    <div>
      <div className="section-header">
        <h1>Energy</h1>
        <p>Monitor your energy consumption</p>
      </div>

      {/*  SUMMARY CARDS */}
      <div className="energy-stats">
        <div className="energy-card">
          <p>Total Energy Today</p>
          <h2>{totalEnergy.toFixed(2)} kWh</h2>
        </div>

        <div className="energy-card">
          <p>Active Devices</p>
          <h2>{activeDevices}</h2>
        </div>

        <div className="energy-card">
          <p>Highest Consumption</p>
          <h2>{highestRoom}</h2>
        </div>

      </div>

      {/*  ENERGY BY ROOM */}
      <div className="energy-rooms-section">
        <h2>Energy by Room</h2>

        <div className="energy-rooms-grid">
          {rooms.map((room) => {
            const energy = energyByRoom[room.id] || 0;

            return (
              <div className="energy-room-card" key={room.id}>
                <div>
                  <h3>{room.name}</h3>
                  <p>Floor {room.floor}</p>
                </div>

                <div
                  className="energy-value"
                  style={{
                    color: energy > 2 ? "#ef4444" : "#22c55e",
                  }}
                >
                  {energy.toFixed(2)} kWh
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="energy-devices-section">
  <h2>Energy by Device</h2>

  <div className="energy-devices-grid">
    {devices.map((device) => {
      const energy = energyByDevice[device.id] || 0;

      return (
        <div className="energy-device-card" key={device.id}>
          <div>
            <h3>{device.name}</h3>
            <p>{device.device_type}</p>
          </div>

          <div
            className="energy-value"
            style={{
              color: energy > 2 ? "#ef4444" : "#22c55e",
            }}
          >
            {energy.toFixed(2)} kWh
          </div>
        </div>
      );
    })}
  </div>
</div>
<div className="top-consumers-section">
  <h2>Top Consumers</h2>

  <div className="top-consumers-list">
    {topDevices.map((device, index) => (
      <div className="top-consumer-card" key={device.id}>
        <span className="rank">#{index + 1}</span>

        <div className="consumer-info">
          <strong>{device.name}</strong>
          <p>{device.device_type}</p>
        </div>

        <div className="energy-value">
          {device.energy.toFixed(2)} kWh
        </div>
      </div>
    ))}
  </div>
</div>
    </div>
  );
}

export default Energy;