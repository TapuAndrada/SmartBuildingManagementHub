import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function AdminPanel({ token }) {
  const [allUsers, setAllUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    full_name: '' 
  });

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAllUsers(response.data.filter(u => u.role !== 'admin'));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (userId) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/users/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      alert("Failed to approve user.");
    }
  };


  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (error) {
        alert("Error deleting user.");
      }
    }
  };

  const handleCreateUser = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post("http://127.0.0.1:8000/register", newUser);
    const newUserId = response.data.id; 
    if (newUserId) {
      await axios.patch(`http://127.0.0.1:8000/users/${newUserId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    alert("User created and activated!");
    setShowAddForm(false);
    setNewUser({ username: '', email: '', password: '', full_name: '' });
    fetchUsers();
  } catch (error) {
    console.error(error);
    alert("Error creating user.");
  }
};

  const pendingUsers = allUsers.filter(u => !u.is_approved);
  const activeUsers = allUsers.filter(u => u.is_approved);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Access Control</h2>
        <button className="btn-add-user" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add New User"}
        </button>
      </div>

      {}
      {showAddForm && (
        <form className="admin-add-form" onSubmit={handleCreateUser}>
          <input 
            type="text" placeholder="Full Name" required
            value={newUser.full_name}
            onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} 
          />
          <input 
            type="text" placeholder="Username" required
            value={newUser.username}
            onChange={(e) => setNewUser({...newUser, username: e.target.value})} 
          />
          <input 
            type="email" placeholder="Email Address" required
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
          />
          <input 
            type="password" placeholder="Password" required
            value={newUser.password}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
          />
          <button type="submit" className="btn-grant">Save & Activate</button>
        </form>
      )}

      {}
      <section className="admin-section">
        <h3>Awaiting Approval</h3>
        {pendingUsers.length === 0 ? (
          <p className="no-requests">No new access requests at the moment.</p>
        ) : (
          <table className="admin-table pending-style">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name || user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <button onClick={() => handleApprove(user.id)} className="btn-grant">Approve</button>
                    <button onClick={() => handleDelete(user.id)} className="btn-delete">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {}
      <section className="admin-section" style={{ marginTop: '50px' }}>
        <h3>Active Users</h3>
        {activeUsers.length === 0 ? (
            <p className="no-requests">No active users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name || user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <button onClick={() => handleDelete(user.id)} className="btn-delete">Delete User</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default AdminPanel;