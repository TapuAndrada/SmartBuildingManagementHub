const API_URL = "http://127.0.0.1:8000";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

export const loginUser = async (email, password) => {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);
  const res = await fetch(`${API_URL}/login`, { method: "POST", body: formData });
  return res.json();
};

export const getMe = async (token) => {
  const res = await fetch(`${API_URL}/users/me`, { headers: authHeaders(token) });
  return res.json();
};

export const swapMyRoom = async (token, roomId) => {
  const res = await fetch(`${API_URL}/users/me/room`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ room_id: roomId }),
  });
  return res.json();
};

export const getRooms = async (token) => {
  const res = await fetch(`${API_URL}/rooms/`, { headers: authHeaders(token) });
  return res.json();
};

export const createRoom = async (token, roomData) => {
  const res = await fetch(`${API_URL}/rooms/`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(roomData),
  });
  if (!res.ok) throw new Error("Failed to create room");
  return res.json();
};

export const turnOffAllInRoom = async (token, roomId) => {
  const res = await fetch(`${API_URL}/rooms/${roomId}/turn-off-all`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return res.json();
};

export const getDevices = async (token) => {
  const res = await fetch(`${API_URL}/devices`, { headers: authHeaders(token) });
  return res.json();
};

// FIXED: was sending { status }, backend expects { is_on }
export const updateDevice = async (token, deviceId, isOn) => {
  const res = await fetch(`${API_URL}/devices/${deviceId}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ is_on: isOn }),
  });
  return res.json();
};

export const updateDeviceSettings = async (token, deviceId, settings) => {
  const res = await fetch(`${API_URL}/devices/${deviceId}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
  return res.json();
};

export const createDevice = async (token, deviceData) => {
  const res = await fetch(`${API_URL}/devices/`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(deviceData),
  });
  if (!res.ok) throw new Error("Failed to create device");
  return res.json();
};

export const getSensors = async (token, roomId) => {
  const res = await fetch(`${API_URL}/sensors/room/${roomId}/latest`, {
    headers: authHeaders(token),
  });
  return res.json();
};

export const getSensorHistory = async (token, roomId) => {
  const res = await fetch(`${API_URL}/sensors/room/${roomId}`, {
    headers: authHeaders(token),
  });
  return res.json();
};

export const getDeviceTotalEnergy = async (token, deviceId) => {
  const res = await fetch(`${API_URL}/energy/device/${deviceId}/total`, {
    headers: authHeaders(token),
  });
  return res.json();
};

export const getRoomTotalEnergy = async (token, roomId) => {
  const res = await fetch(`${API_URL}/energy/room/${roomId}/total`, {
    headers: authHeaders(token),
  });
  return res.json();
};