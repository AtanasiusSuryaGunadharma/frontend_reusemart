// /* eslint-disable no-unused-vars */
// import React from "react";
// import { Link } from "react-router-dom"; // Import Link
// import "./generalLogin.css";
// import { FaUserTie, FaWarehouse, FaBuilding, FaShoppingCart } from 'react-icons/fa';
// // Hapus import axios, useState, useNavigate jika tidak digunakan di sini lagi

// const GeneralLogin = () => {
//     // Hapus state untuk email, password, rememberMe, error
//     // Hapus fungsi handleSubmit
//     // Hapus useEffect jika ada yang berkaitan dengan form login

//     // Data untuk setiap role login
//     const roles = [
//         { name: "Pegawai", description: "Masuk sebagai pegawai", link: "/admin/login", IconComponent: FaUserTie }, // Link ke halaman login pegawai
//         { name: "Penitip", description: "Masuk untuk menitipkan barang", link: "/penitip/login", IconComponent: FaWarehouse }, // Akan diarahkan ke halaman login penitip
//         { name: "Organisasi", description: "Masuk sebagai perwakilan organisasi", link: "/organisasi/login", IconComponent: FaBuilding }, // Akan diarahkan ke halaman login organisasi
//         { name: "Pembeli", description: "Masuk untuk berbelanja", link: "/pembeli/login", IconComponent: FaShoppingCart }, // Akan diarahkan ke halaman login pembeli
//     ];

//     return (
//         <div className="login-page">
//             {/* Navbar - Tetap sama */}
//             <nav className="navbar">
//                 <div className="logo">
//                     <span>REUSEMART</span>
//                 </div>
//                 <ul className="nav-links">
//                     <li><Link to="/">Home</Link></li>
//                     <li><Link to="/shop">Shop</Link></li>
//                     <li><Link to="/generalRegister">Register</Link></li>
//                 </ul>
                
//                 <div className="nav-icons">
//                      <i className="fas fa-search"></i> {/* Jika ikon search juga tidak muncul, Anda mungkin perlu mencari alternatif Font Awesome ini juga */}
//                  </div>
//             </nav>

//             {/* Konten untuk pilihan role */}
//             <div className="role-selection-container">
//                 <div className="login-logo">
//                     <img src="/Logo.png" alt="Reusemart Logo" />
//                     <span>REUSEMART</span>
//                 </div>
//                 <h2>Pilih Role Login Anda</h2>
//                 <p>Silakan pilih jenis akun Anda untuk melanjutkan.</p>

//                 <div className="role-cards-grid">
//                     {roles.map((role) => (
//                         <Link to={role.link} key={role.name} className="role-card">
//                             {/* Render komponen ikon di sini */}
//                             {/* Anda bisa menambahkan class role-icon ke komponen ini jika ingin styling CSS yang sama */}
//                             <role.IconComponent className="role-icon" />
//                             <h3>{role.name}</h3>
//                             <p>{role.description}</p>
//                         </Link>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default GeneralLogin;

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
        localStorage.setItem("userName", user.name);
        localStorage.setItem("id_pegawai", user.role === "admin" || user.role === "owner" || user.role === "cs" || user.role === "pegawaiGudang" || user.role === "kurir" || user.role === "hunter" ? user.id : "");
        localStorage.setItem("id_organisasi", user.role === "organisasi" ? user.id : "");
        localStorage.setItem("id_penitip", user.role === "penitip" ? user.id : "");
        localStorage.setItem("id_pembeli", user.role === "pembeli" ? user.id : "");

        // Redirect ke dashboard sesuai role yang didapat
        navigate(`/${user.role}/dashboard`);
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
