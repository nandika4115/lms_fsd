import React, { useState } from "react";
import axios from "axios";

// This URL must match your backend's address and port
const API_URL = "http://localhost:5000";

function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      alert("Username and password required");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      alert(res.data.message);
      setFormData({ username: "", password: "" });
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.message || "Invalid login");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;