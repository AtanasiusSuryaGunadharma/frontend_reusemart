// src\JSX\Login\Pembeli\loginPembeli.jsx
import React, { useState } from "react";
// Import CSS yang sesuai untuk Pembeli
import "./loginPembeli.css"; // <-- Pastikan ini mengarah ke file CSS yang benar
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const LoginPembeli = () => { // <-- Ganti nama komponen menjadi LoginPembeli
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error message

    try {
      // Ganti URL endpoint API ke login pembeli
      console.log("Sending login request to:", "http://127.0.0.1:8000/api/pembeli/login");
      // Ganti key payload sesuai dengan yang diterima backend Pembeli (email_pembeli, password_pembeli)
      console.log("Payload:", { email_pembeli: email, password_pembeli: password });

      const response = await axios.post("http://127.0.0.1:8000/api/pembeli/login", {
        email_pembeli: email, // <-- Gunakan key payload Pembeli
        password_pembeli: password, // <-- Gunakan key payload Pembeli
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("Response:", response.data);

      // Sesuaikan logika penanganan response sukses
      // Backend Pembeli Anda mengembalikan message, token, dan user data (id_pembeli, username_pembeli, dll)
      if (response.data && response.data.token && response.data.user) {
        const { user, token } = response.data;

        // Simpan data di Local Storage
        localStorage.setItem("userRole", "pembeli"); // <-- Set role secara eksplisit
        localStorage.setItem("authToken", token);
        // Simpan data user spesifik pembeli
        localStorage.setItem("id_pembeli", user.id_pembeli);
        localStorage.setItem("username_pembeli", user.username_pembeli); // Simpan username atau nama
        localStorage.setItem("email_pembeli", user.email_pembeli); // Simpan email
        localStorage.setItem("password_pembeli", user.password_pembeli); // Simpan password
        // localStorage.setItem("alamat_pembeli", user.alamat_pembeli); // Simpan alamat
        localStorage.setItem("no_telepon_pembeli", user.no_telepon_pembeli); // Simpan no telepon
        localStorage.setItem("poin_loyalitas", user.poin_loyalitas); // Simpan poin
        localStorage.setItem("tgl_lahir_pembeli", user.tgl_lahir_pembeli); // Simpan tanggal lahir

        // ... simpan data pembeli lainnya jika dibutuhkan (poin, no telepon, dll)

        // Redirect ke halaman tujuan setelah sukses login (misal: halaman Shop atau Home)
        navigate("/"); // <-- Ganti dengan rute halaman tujuan pembeli Anda (misal: /shop, /home, atau /pembeli/dashboard)

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
        <h2>Masuk Pembeli</h2> {/* <-- Judul spesifik */}
        <p>Silakan masuk menggunakan akun Pembeli Anda.</p> {/* <-- Sub-judul spesifik */}
        {error && <p className="error-message">{error}</p>}
        <div className="login-form">
          <input
            type="email" // Sesuaikan dengan input yang dibutuhkan (email atau username)
            placeholder="contoh@pembeli.com" // <-- Sesuaikan placeholder
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
          {/* Link register mungkin perlu mengarah ke halaman registrasi Pembeli jika berbeda */}
          <p className="register-link">
            Tidak Punya Akun Pembeli? <Link to="/generalRegister">Create one</Link> {/* <-- Contoh link register spesifik */}
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

export default LoginPembeli; // <-- Export komponen dengan nama baru
