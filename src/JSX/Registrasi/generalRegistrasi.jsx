// src\JSX\Registrasi\generalRegistrasi.jsx
/* eslint-disable no-unused-vars */
import React from "react";
import { Link } from "react-router-dom";
// Sesuaikan import CSS
import "./generalRegistrasi.css"; // <-- Import CSS untuk registrasi
// Anda mungkin butuh ikon yang berbeda, atau bisa tetap menggunakan ikon Fa
import { FaBuilding, FaShoppingCart } from 'react-icons/fa';

const GeneralRegistrasi = () => { // <-- Ganti nama komponen menjadi GeneralRegistrasi

  // Data untuk pilihan role saat registrasi
  const registrationOptions = [ // <-- Ganti nama variabel
    // Hanya sertakan role yang bisa mendaftar lewat umum
    { name: "Pembeli", description: "Daftar sebagai pembeli individu", link: "/pembeli/registrasi", IconComponent: FaShoppingCart }, // Link ke halaman registrasi Pembeli
    { name: "Organisasi", description: "Daftar sebagai perwakilan organisasi", link: "/organisasi/registrasi", IconComponent: FaBuilding }, // Link ke halaman registrasi Organisasi
    // Role lain seperti Pegawai, Penitip biasanya tidak mendaftar lewat umum
  ];

  return (
    // Gunakan class yang sama untuk re-use style atau buat class baru jika perlu
    <div className="login-page"> {/* Bisa diganti ke general-selection-page jika mau */}

      {/* Navbar - Mirip dengan halaman login/home */}
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>
          {/* Ubah link Login dan Register di navbar */}
          <li><Link to="/generalLogin">Login</Link></li> {/* Link ke halaman pilihan Login */}
        </ul>

        <div className="nav-icons">
          <i className="fas fa-search"></i>
        </div>
      </nav>

      {/* Konten untuk pilihan role registrasi */}
      {/* Gunakan class yang sama untuk re-use style atau buat class baru jika perlu */}
      <div className="role-selection-container"> {/* Bisa diganti ke registration-selection-container jika mau */}
        <div className="login-logo"> {/* Bisa diganti ke selection-logo jika mau */}
          <img src="/Logo.png" alt="Reusemart Logo" />
          <span>REUSEMART</span>
        </div>
        <h2>Pilih Role Registrasi Anda</h2> {/* <-- Ganti judul */}
        <p>Silakan pilih jenis akun yang ingin Anda daftarkan.</p> {/* <-- Ganti sub-judul */}

        {/* Gunakan class yang sama untuk re-use style atau buat class baru jika perlu */}
        <div className="role-cards-grid"> {/* Bisa diganti ke registration-cards-grid jika mau */}
          {registrationOptions.map((option) => ( // <-- Gunakan variabel baru
            <Link to={option.link} key={option.name} className="role-card"> {/* Class role-card bisa di-re-use */}
              {/* Render komponen ikon */}
              <option.IconComponent className="role-icon" /> {/* Class role-icon bisa di-re-use */}
              <h3>{option.name}</h3>
              <p>{option.description}</p>
            </Link>
          ))}
        </div>

        {/* Anda bisa menambahkan link kembali ke login jika perlu */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          Sudah Punya Akun? <Link to="/generalLogin">Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
};

export default GeneralRegistrasi; // <-- Export komponen dengan nama baru
