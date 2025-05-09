// src\JSX\Registrasi\Organisasi\registrasiOrganisasi.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./registrasiOrganisasi.css"; // <-- Import CSS untuk form registrasi Organisasi
import { toast } from 'react-toastify'; // <-- Import toast

const RegistrasiOrganisasi = () => { // <-- Ganti nama komponen menjadi RegistrasiOrganisasi
  // State untuk menyimpan nilai dari setiap input form (sesuai $fillable Organisasi)
  const [formData, setFormData] = useState({
    nama_organisasi: "",
    alamat_organisasi: "",
    no_telepon_organisasi: "",
    email_organisasi: "",
    password_organisasi: "",
  });

  // State untuk indikator loading
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handler untuk setiap perubahan input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handler saat form disubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Sending registration data to:", "http://127.0.0.1:8000/api/organisasi");
      console.log("Payload:", formData);

      const response = await axios.post("http://127.0.0.1:8000/api/organisasi", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Registration successful:", response.data);
      toast.success(response.data.message || "Registrasi berhasil! Silakan masuk.");

      setFormData({
        nama_organisasi: "",
        alamat_organisasi: "",
        no_telepon_organisasi: "",
        email_organisasi: "",
        password_organisasi: "",
      });

      navigate("/organisasi/login");
    } catch (err) {
      console.error("Registration error:", err.response ? err.response.data : err.message);

      if (err.response && err.response.data && err.response.data.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat().join(" ");
        toast.error(`Registrasi gagal: ${errorMessages}`);
      } else if (err.response && err.response.data && err.response.data.message) {
        toast.error(`Registrasi gagal: ${err.response.data.message}`);
      } else {
        toast.error("Registrasi gagal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>
          <li><Link to="/generalLogin">Login</Link></li>
          <li><Link to="/generalRegister">Register</Link></li>
        </ul>
        <div className="nav-icons">
          <i className="fas fa-search"></i>
        </div>
      </nav>

      <div className="registration-container">
        <div className="registration-logo">
          <img src="/Logo.png" alt="Reusemart Logo" />
          <span>REUSEMART</span>
        </div>
        <h2>Registrasi Organisasi</h2>
        <p>Silakan isi detail Organisasi Anda untuk mendaftar.</p>

        <form className="registration-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="nama_organisasi"
            placeholder="Nama Organisasi"
            value={formData.nama_organisasi}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="alamat_organisasi"
            placeholder="Alamat Organisasi"
            value={formData.alamat_organisasi}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="no_telepon_organisasi"
            placeholder="Nomor Telepon Organisasi"
            value={formData.no_telepon_organisasi}
            onChange={handleInputChange}
            required
          />
          <input
            type="email"
            name="email_organisasi"
            placeholder="Email Organisasi"
            value={formData.email_organisasi}
            onChange={handleInputChange}
            required
          />
          <input
            type="password"
            name="password_organisasi"
            placeholder="Password"
            value={formData.password_organisasi}
            onChange={handleInputChange}
            required
            minLength="6"
          />
          {/* Opsional: Konfirmasi Password */}
          {/* <input type="password" name="password_confirmation" placeholder="Konfirmasi Password" ... /> */}

          <button type="submit" className="registration-btn" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar Akun'}
          </button>
        </form>

        <div className="switch-link">
          Sudah Punya Akun? <Link to="/generalLogin">Masuk di sini</Link>
        </div>
        <div className="switch-link">
          Bukan Organisasi? <Link to="/generalRegister">Pilih Role Lain</Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrasiOrganisasi; // <-- Export komponen dengan nama baru
