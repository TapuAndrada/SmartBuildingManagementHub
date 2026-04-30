const API_URL = "http://127.0.0.1:8000";

export const loginUser = async (email, password) => {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    body: formData,
  });

  return response.json();
};

export const getRooms = async (token) => {
  const response = await fetch(`${API_URL}/rooms/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const getDevices = async (token) => {
  const response = await fetch("http://127.0.0.1:8000/devices", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const updateDevice = async (token, deviceId, status) => {
  const response = await fetch(
    `http://127.0.0.1:8000/devices/${deviceId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );
  return response.json();
};

export const getSensors = async (token, roomId) => {
  const response = await fetch(
    `http://127.0.0.1:8000/sensors/room/${roomId}/latest`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getEnergy = async (token, roomId) => {
  const response = await fetch(
    `http://127.0.0.1:8000/energy/room/${roomId}/total`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getDeviceTotalEnergy = async (token, deviceId) => {
  const response = await fetch(`${API_URL}/energy/device/${deviceId}/total`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const getRoomTotalEnergy = async (token, roomId) => {
  const response = await fetch(`${API_URL}/energy/room/${roomId}/total`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const createDevice = async (token, deviceData) => {
  const response = await fetch("http://127.0.0.1:8000/devices/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });

  if (!response.ok) {
    throw new Error("Failed to create device");
  }

  return response.json();
};