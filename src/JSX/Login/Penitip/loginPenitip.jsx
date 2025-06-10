// src\JSX\Login\Penitip\loginPenitip.jsx
import React, { useState } from "react";
// Import CSS yang sesuai untuk Penitip
import "./loginPenitip.css"; // <-- Pastikan ini mengarah ke file CSS yang benar
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const LoginPenitip = () => { // <-- Ganti nama komponen menjadi LoginPenitip
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error message

    try {
      // Ganti URL endpoint API ke login penitip
      console.log("Sending login request to:", "http://127.0.0.1:8000/api/penitip/login");
      // Ganti key payload sesuai dengan yang diterima backend Penitip (email_penitip, password_penitip)
      console.log("Payload:", { email_penitip: email, password_penitip: password });

      const response = await axios.post("http://127.0.0.1:8000/api/penitip/login", {
        email_penitip: email, // <-- Gunakan key payload Penitip
        password_penitip: password, // <-- Gunakan key payload Penitip
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("Response:", response.data);

      // Sesuaikan logika penanganan response sukses
      // Backend Penitip Anda mengembalikan message, token, dan user data (id_penitip, email_penitip, dll)
      if (response.data && response.data.token && response.data.user) {
        const { user, token } = response.data;

        // Simpan data di Local Storage
        localStorage.setItem("userRole", "penitip"); // <-- Set role secara eksplisit
        localStorage.setItem("authToken", token);
        // Simpan data user spesifik penitip
        localStorage.setItem("id_penitip", user.id_penitip);
        localStorage.setItem("email_penitip", user.email_penitip); // Simpan email
        localStorage.setItem("no_telepon_penitip", user.no_telepon_penitip); // Simpan no telepon
        localStorage.setItem("nama_penitip", user.nama_penitip); // Simpan nama
        localStorage.setItem("rating_penitip", user.rating_penitip); // Simpan rating
        localStorage.setItem("pendapatan_penitip", user.pendapatan_penitip); // Simpan pendapatan
        localStorage.setItem("bonus_terjual_cepat", user.bonus_terjual_cepat); // Simpan bonus_terjual_cepat
        localStorage.setItem("reward_program_sosial", user.reward_program_sosial); // Simpan reward_program_sosial
        localStorage.setItem("tgl_lahir_penitip", user.tgl_lahir_penitip); // Simpan tgl_lahir_penitip
        // ... simpan data penitip lainnya jika dibutuhkan (rating, pendapatan, dll)

        // Redirect ke halaman dashboard Penitip setelah sukses login
        // Anda perlu membuat rute dan komponen dashboard/halaman utama untuk penitip
        navigate("/penitip/dashboard"); // <-- Ganti dengan rute dashboard Penitip Anda

      } else {
        // Tangani kasus sukses tapi format response tidak sesuai harapan (kurang token/user)
        setError(response.data.message || "Login berhasil tapi data tidak lengkap.");
      }
    } catch (err) {
      console.error("Login error:", err.response ? err.response.data : err.message);
      // Tangani error response dari server
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // Tampilkan pesan error dari backend
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
          {/* Link ini mungkin perlu diubah agar tidak kembali ke /login umum */}
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
        {/* Ganti judul dan sub-judul */}
        <h2>Masuk Penitip</h2> {/* <-- Judul spesifik */}
        <p>Silakan masuk menggunakan akun Penitip Anda.</p> {/* <-- Sub-judul spesifik */}
        {error && <p className="error-message">{error}</p>}
        <div className="login-form">
          <input
            type="email" // Sesuaikan dengan input yang dibutuhkan (email atau username)
            placeholder="contoh@penitip.com" // <-- Sesuaikan placeholder
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
        </div>
        {/* Opsional: Link kembali ke halaman pilihan role */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/generalLogin">Kembali ke Pilihan Role</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPenitip; // <-- Export komponen dengan nama baru
