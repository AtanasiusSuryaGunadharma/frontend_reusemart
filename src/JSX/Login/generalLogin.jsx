// src\JSX\Login\generalLogin.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const GeneralLogin = () => {
  // State untuk menyimpan input email, password, error, dan rememberMe
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Fungsi dipanggil saat submit form login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Kirim data login ke endpoint backend (login-general)
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login-general",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      // Cek response sukses
      if (response.data.status === "success") {
        const { user, token } = response.data;

        // Simpan data login di localStorage (atau bisa pakai Context/Redux)
        localStorage.setItem("authToken", token);
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name); // Pastikan ini juga disimpan di login pembeli spesifik
        localStorage.setItem("id_pegawai", user.role === "admin" || user.role === "owner" || user.role === "cs" || user.role === "pegawaiGudang" || user.role === "kurir" || user.role === "hunter" ? user.id : "");
        localStorage.setItem("id_organisasi", user.role === "organisasi" ? user.id : "");
        localStorage.setItem("id_penitip", user.role === "penitip" ? user.id : "");
        localStorage.setItem("id_pembeli", user.role === "pembeli" ? user.id : "");

        // Redirect berdasarkan role
        switch (user.role) {
          case 'pembeli':
            navigate("/shop-pembeli"); // <-- UBAH REDIRECT UNTUK PEMBELI KE SHOP PEMBELI
            break;
          case 'admin':
            navigate("/admin/dashboard");
            break;
          case 'owner':
            navigate("/owner/dashboard");
            break;
          case 'cs':
            navigate("/cs/dashboard");
            break;
          case 'warehouse':
            navigate("/pegawaiGudang/dashboard");
            break;
          case 'hunter':
            navigate("/hunter/dashboard");
            break;
          case 'courier':
            navigate("/courier/dashboard");
            break;
          case 'penitip': // Tambahkan case ini jika belum ada
            navigate("/penitip/dashboard");
            break;
          case 'organisasi': // Tambahkan case ini jika belum ada
            navigate("/organisasi/dashboard");
            break;
          default:
            navigate("/shop"); // Default ke shop versi guest jika role tidak dikenali
            break;
        }
      } else {
        // Jika response gagal, tampilkan pesan error dari server
        setError(response.data.message || "Login gagal");
      }
    } catch (err) {
      // Tangani error jaringan / server
      setError(err.response?.data?.message || "Terjadi kesalahan server");
    }
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="logo">REUSEMART</div>
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/shop">Shop</Link>
          </li>
          <li>
            <Link to="/generalRegister">Register</Link>
          </li>
        </ul>
      </nav>

      <div className="login-container">
        <div className="login-logo">
          <img src="/Logo.png" alt="Reusemart Logo" />
          <span>REUSEMART</span>
        </div>

        <h2>Masuk ke Reusemart</h2>
        <p>Silakan masuk menggunakan akun Anda.</p>

        {/* Jika ada error, tampilkan pesan error */}
        {error && <p className="error-message">{error}</p>}

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Ingat Saya
          </label>

          <button type="submit" className="login-btn">
            Masuk
          </button>
        </form>

        <p className="register-link">
          Belum punya akun? <Link to="/generalRegister">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default GeneralLogin;
