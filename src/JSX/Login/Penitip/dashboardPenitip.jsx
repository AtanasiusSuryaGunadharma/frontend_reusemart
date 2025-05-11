// src\JSX\Login\Penitip\dashboardPenitip.jsx
import React, { useState, useEffect } from "react";
import "./dashboardPenitip.css"; // <-- Import CSS untuk dashboard Penitip
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';

const PenitipDashboard = () => {
  // State untuk menyimpan data profil Penitip
  const [penitipProfile, setPenitipProfile] = useState(null);
  // State untuk indikator loading dan error saat fetch data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Handler Logout
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    localStorage.removeItem("id_penitip");
    localStorage.removeItem("email_penitip");
    localStorage.removeItem("no_telepon_penitip");
    localStorage.removeItem("nama_penitip");
    localStorage.removeItem("rating_penitip");
    localStorage.removeItem("pendapatan_penitip");
    localStorage.removeItem("bonus_terjual_cepat");
    localStorage.removeItem("reward_program_sosial");
    localStorage.removeItem("tgl_lahir_penitip");
    localStorage.removeItem("id_pegawai");
    localStorage.removeItem("name");
    localStorage.removeItem("jabatan");
    localStorage.removeItem("id_organisasi");
    localStorage.removeItem("nama_organisasi");
    localStorage.removeItem("email_organisasi");
    localStorage.removeItem("id_pembeli");
    localStorage.removeItem("username_pembeli");
    localStorage.removeItem("email_pembeli");

    navigate("/generalLogin"); // Redirect ke halaman pilihan login
    toast.info("Anda telah logout.");
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const penitipId = localStorage.getItem("id_penitip");
    const userRole = localStorage.getItem("userRole");

    if (!token || !penitipId || userRole !== 'penitip') {
      navigate("/generalLogin");
      toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
      return;
    }

    const fetchPenitipProfile = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/penitip/${penitipId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPenitipProfile(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching penitip profile:", err);
        setError("Gagal memuat data profil. Silakan coba refresh.");
        setLoading(false);
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      }
    };

    fetchPenitipProfile();
  }, [navigate]);

  return (
    <div className="penitip-dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART PENITIP</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/penitip/dashboard">Dashboard</Link></li>
          <li><Link to="/" onClick={handleLogout}>Logout</Link></li>
        </ul>
      </nav>

      {/* Konten Dashboard */}
      <div className="dashboard-container">
        <h2>Dashboard Penitip</h2>

        {/* Bagian Profil Penitip */}
        <div className="dashboard-section">
          <h3>Profil Anda</h3>

          {loading && <p>Memuat profil...</p>}
          {error && <p className="error-message">{error}</p>}

          {!loading && !error && penitipProfile && (
            <div className="profile-details">
              <p><strong>ID:</strong> {penitipProfile.id_penitip}</p>
              <p><strong>Nama:</strong> {penitipProfile.nama_penitip}</p>
              <p><strong>Email:</strong> {penitipProfile.email_penitip}</p>
              <p><strong>Nomor Telepon:</strong> {penitipProfile.no_telepon_penitip}</p>
              <p><strong>Tanggal Lahir:</strong> {penitipProfile.tgl_lahir_penitip}</p>
              <p><strong>Rating:</strong> {penitipProfile.rating_penitip}</p>
              <p><strong>Saldo:</strong> Rp. {penitipProfile.pendapatan_penitip}</p>
              <p><strong>Bonus Terjual Cepat:</strong> Rp. {penitipProfile.bonus_terjual_cepat}</p>
              <p><strong>Reward Program Sosial:</strong> Rp. {penitipProfile.reward_program_sosial}</p>
            </div>
          )}

          {/* <Link to="/penitip/profile/edit" className="profile-link">Edit Profil</Link> */}
        </div>

        {/* Tambahkan bagian dashboard lain di sini jika diperlukan */}
        {/* <div className="dashboard-section"> ... </div> */}
      </div>
    </div>
  );
};

export default PenitipDashboard;
