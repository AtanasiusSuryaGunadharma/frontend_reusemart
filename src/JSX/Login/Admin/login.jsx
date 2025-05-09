import React, { useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error message

    try {
      console.log("Sending login request to:", "http://127.0.0.1:8000/api/pegawai/login");
      console.log("Payload:", { email_pegawai: email, password_pegawai: password });

      const response = await axios.post("http://127.0.0.1:8000/api/pegawai/login", {
        email_pegawai: email,
        password_pegawai: password,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("Response:", response.data);

      if (response.data.status === "success") {
        const { user, token } = response.data;
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("authToken", token);
        localStorage.setItem("id_pegawai", user.id_pegawai);
        localStorage.setItem("name", user.nama_pegawai);
        localStorage.setItem("jabatan", user.jabatan);

        switch (user.role) {
          case 'admin':
            navigate("/admin/dashboard");
            break;
          case 'manager':
            navigate("/manager/dashboard");
            break;
          case 'cs':
            navigate("/cs/dashboard");
            break;
          case 'warehouse':
            navigate("/warehouse/dashboard");
            break;
          case 'hunter':
            navigate("/hunter/dashboard");
            break;
          case 'courier':
            navigate("/courier/dashboard");
            break;
          default:
            navigate("/shop");
            break;
        }
      } else {
        setError(response.data.message || "Login gagal");
      }
    } catch (err) {
      console.error("Login error:", err.response ? err.response.data : err.message);
      setError("Gagal terhubung ke server. Silakan coba lagi. Detail: " + (err.response ? err.response.data.message : err.message));
    }
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/login">Login / Register</Link></li>
        </ul>
        <div className="nav-icons">
          <i className="fas fa-search"></i>
        </div>
      </nav>

      <div className="login-container">
        <div className="login-logo">
          <img src="/Logo.png" alt="Reusemart Logo" />
          <span>REUSEMART</span>
        </div>
        <h2>Masuk</h2>
        <p>Silakan masuk untuk melanjutkan ke akun Anda.</p>
        {error && <p className="error-message">{error}</p>}
        <div className="login-form">
          <input
            type="email"
            placeholder="contoh@reusmart.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="password-wrapper">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <i className="fas fa-eye"></i>
          </div>
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Ingat Saya
          </label>
          <button className="login-btn" onClick={handleSubmit}>
            Masuk
          </button>
            {/* Opsional: Link kembali ke halaman pilihan role */}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Link to="/generalLogin">Kembali ke Pilihan Role</Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;