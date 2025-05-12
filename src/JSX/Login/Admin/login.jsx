// src\JSX\Login\Admin\login.jsx (Modified for Forgot Password)
import React, { useState } from "react";
import "./Login.css"; // Pastikan CSS Anda memiliki gaya untuk modal lupa password
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify'; // Import toast

const Login = () => { // Komponen ini digunakan untuk login Pegawai (termasuk Admin, Owner, CS, Gudang, dll)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // State BARU untuk fitur Lupa Password
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false); // Status modal lupa password
  const [resetEmail, setResetEmail] = useState(''); // Input email di modal lupa password
  const [resetLoading, setResetLoading] = useState(false); // Loading state untuk reset password

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error message

    try {
      console.log("Sending login request to:", "http://127.0.0.1:8000/api/pegawai/login");
      console.log("Payload:", { email_pegawai: email, password_pegawai: password });

      const response = await axios.post("http://127.0.0.1:8000/api/pegawai/login", {
        email_pegawai: email,
        password_pegawai: password, // Pastikan backend menggunakan Hash::check()
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

        // Redirect berdasarkan role
        switch (user.role) {
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
            navigate("/pegawaiGudang/dashboard"); // <-- Rute Pegawai Gudang
            break;
          case 'hunter':
            navigate("/hunter/dashboard"); // <-- Rute Hunter
            break;
          case 'courier':
            navigate("/courier/dashboard"); // <-- Rute Kurir
            break;
          default:
            navigate("/shop"); // Default ke shop jika role tidak dikenali
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

  // Handler BARU untuk submit form lupa password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true); // Aktifkan loading
    setError(""); // Reset error login utama

    try {
      console.log("Sending reset password request for email:", resetEmail);

      const response = await axios.post("http://127.0.0.1:8000/api/pegawai/forgot-password", {
        email_pegawai: resetEmail,
      });

      console.log("Reset password response:", response.data);
      toast.success(response.data.message || "Instruksi reset password telah dikirim.");

      setResetEmail('');
      setShowForgotPasswordModal(false);
    } catch (err) {
      console.error("Error resetting password:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Gagal mereset password. Silakan coba lagi.');
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setResetEmail('');
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/generalLogin">Login</Link></li>
          <li><Link to="/generalRegister">Register</Link></li>
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
        <h2>Masuk Pegawai</h2>
        <p>Silakan masuk menggunakan akun Pegawai Anda.</p>
        {error && <p className="error-message">{error}</p>}
        <div className="login-form">
          <input
            type="email"
            placeholder="Email Pegawai"
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

          <div className="forgot-password-link" style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0056a3',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Lupa Password?
            </button>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/generalLogin">Kembali ke Pilihan Role</Link>
          </div>
        </div>
      </div>

      {showForgotPasswordModal && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Lupa Password Pegawai</h3>
              <button className="close-btn" onClick={handleCloseForgotPasswordModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} style={{ padding: '1.5rem' }}>
              <p>Masukkan email akun Pegawai Anda untuk mereset password ke tanggal lahir (YYYY-MM-DD).</p>
              <div className="form-group">
                <label htmlFor="resetEmail">Email:</label>
                <input
                  type="email"
                  id="resetEmail"
                  placeholder="contoh@reusmart.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseForgotPasswordModal}>
                  Batal
                </button>
                <button type="submit" className="submit-btn" disabled={resetLoading}>
                  {resetLoading ? 'Memproses...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
