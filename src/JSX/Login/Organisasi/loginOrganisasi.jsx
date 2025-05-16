// src\JSX\Login\Organisasi\loginOrganisasi.jsx
import React, { useState } from "react";
// Import CSS yang sesuai untuk Organisasi
import "./loginOrganisasi.css"; // <-- Pastikan ini mengarah ke file CSS yang benar
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const LoginOrganisasi = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Sending login request to:", "http://127.0.0.1:8000/api/organisasi/login");
      console.log("Payload:", { email_organisasi: email, password_organisasi: password });

      const response = await axios.post(
        "http://127.0.0.1:8000/api/organisasi/login",
        {
          email_organisasi: email,
          password_organisasi: password,
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log("Response:", response.data);

      if (response.data && response.data.token && response.data.user) {
        const { user, token } = response.data;

        localStorage.setItem("userRole", "organisasi");
        localStorage.setItem("authToken", token);
        localStorage.setItem("id_organisasi", user.id_organisasi);
        localStorage.setItem("nama_organisasi", user.nama_organisasi);
        localStorage.setItem("email_organisasi", user.email_organisasi);
        localStorage.setItem("alamat_organisasi", user.alamat_organisasi);
        localStorage.setItem("password_organisasi", user.password_organisasi);

        navigate("/organisasi/dashboard");
      } else {
        setError(response.data.message || "Login berhasil tapi data tidak lengkap.");
      }
    } catch (err) {
      console.error("Login error:", err.response ? err.response.data : err.message);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal terhubung ke server atau terjadi error. Silakan coba lagi.");
      }
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
          <li><Link to="/generalLogin">Login / Register</Link></li>
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
        <h2>Masuk Organisasi</h2>
        <p>Silakan masuk menggunakan akun Organisasi Anda.</p>
        {error && <p className="error-message">{error}</p>}
        <div className="login-form">
          <input
            type="email"
            placeholder="contoh@organisasi.com"
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
          <p className="register-link">
            Tidak Punya Akun Organisasi? <Link to="/generalRegister">Create one</Link>
          </p>
        </div>
        {/* Opsional: Link kembali ke halaman pilihan role */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/generalLogin">Kembali ke Pilihan Role</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginOrganisasi;
