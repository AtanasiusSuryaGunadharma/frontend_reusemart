// src\JSX\Registrasi\Pembeli\registrasiPembeli.jsx (Modified)
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./registrasiPembeli.css"; // <-- Import CSS untuk form registrasi
import { toast } from 'react-toastify'; // <-- Import toast

const RegistrasiPembeli = () => {
  // State untuk menyimpan nilai dari setiap input form
  const [formData, setFormData] = useState({
    nama_pembeli: "",
    email_pembeli: "",
    tgl_lahir_pembeli: "",
    username_pembeli: "",
    password_pembeli: "",
    no_telepon_pembeli: "",
  });

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
      console.log("Sending registration data to:", "http://127.0.0.1:8000/api/pembeli");
      console.log("Payload:", formData);

      const response = await axios.post("http://127.0.0.1:8000/api/pembeli", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Registration successful:", response.data);
      toast.success(response.data.message || "Registrasi berhasil! Silakan masuk.");

      setFormData({
        nama_pembeli: "",
        email_pembeli: "",
        tgl_lahir_pembeli: "",
        username_pembeli: "",
        password_pembeli: "",
        no_telepon_pembeli: "",
      });

      navigate("/generalLogin");

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
        <h2>Registrasi Pembeli</h2>
        <p>Silakan isi detail Anda untuk mendaftar sebagai Pembeli.</p>

        <form className="registration-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="nama_pembeli"
            placeholder="Nama Lengkap"
            value={formData.nama_pembeli}
            onChange={handleInputChange}
            required
          />

          <input
            type="email"
            name="email_pembeli"
            placeholder="Email (contoh@reusmart.com)"
            value={formData.email_pembeli}
            onChange={handleInputChange}
            required
          />

          <input
            type="date"
            name="tgl_lahir_pembeli"
            placeholder="Tanggal Lahir"
            value={formData.tgl_lahir_pembeli}
            onChange={handleInputChange}
            required
          />

          <input
            type="text"
            name="username_pembeli"
            placeholder="Username"
            value={formData.username_pembeli}
            onChange={handleInputChange}
            required
          />

          <input
            type="password"
            name="password_pembeli"
            placeholder="Password"
            value={formData.password_pembeli}
            onChange={handleInputChange}
            required
            minLength="6"
          />

          <input
            type="text"
            name="no_telepon_pembeli"
            placeholder="Nomor Telepon"
            value={formData.no_telepon_pembeli}
            onChange={handleInputChange}
            required
          />

          <button type="submit" className="registration-btn" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar Akun'}
          </button>
        </form>

        <div className="switch-link">
          Sudah Punya Akun? <Link to="/generalLogin">Masuk di sini</Link>
        </div>
        <div className="switch-link">
          Bukan Pembeli? <Link to="/generalRegister">Pilih Role Lain</Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrasiPembeli;
