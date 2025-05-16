// src\JSX\Login\PegawaiGudang\dashboardPegawaiGudang.jsx
/* eslint-disable no-unused-vars */ // Izinkan unused vars sementara
import React, { useState, useEffect } from "react";
import "./dashboardPegawaiGudang.css"; // Import CSS yang sesuai
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify"; // Import toast

const DashboardPegawaiGudang = () => {
  // State untuk Profil Pegawai Gudang
  const [pegawaiProfile, setPegawaiProfile] = useState(null);

  // State loading dan error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk Role
  const [userRoleState, setUserRoleState] = useState(null);

  const navigate = useNavigate();

  // Handler Logout
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    localStorage.removeItem("id_pegawai");
    localStorage.removeItem("name");
    localStorage.removeItem("jabatan");
    localStorage.removeItem("id_organisasi");
    localStorage.removeItem("nama_organisasi");
    localStorage.removeItem("email_organisasi");
    localStorage.removeItem("id_pembeli");
    localStorage.removeItem("username_pembeli");
    localStorage.removeItem("email_pembeli");
    localStorage.removeItem("id_penitip");
    localStorage.removeItem("email_penitip");
    localStorage.removeItem("no_telepon_penitip");

    navigate("/generalLogin");
    toast.info("Anda telah logout.");
  };

  // Fetch data profil Pegawai Gudang
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const id_pegawai = localStorage.getItem("id_pegawai");
    const userRole = localStorage.getItem("userRole");

    setUserRoleState(userRole);

    if (!token || !id_pegawai || userRole !== "warehouse") {
      navigate("/generalLogin");
      toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
      return;
    }

    const fetchPegawaiProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const profileResponse = await axios.get(
          `http://127.0.0.1:8000/api/pegawai/${id_pegawai}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPegawaiProfile(profileResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching pegawai profile:", err);
        setError("Gagal memuat data profil pegawai.");
        setLoading(false);
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      }
    };

    if (token && id_pegawai && userRole === "warehouse") {
      fetchPegawaiProfile();
    }
  }, [navigate]);

  if (loading) return <div className="loading-state">Memuat Dashboard...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="pegawai-gudang-dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART GUDANG</span>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/pegawaiGudang/dashboard">Dashboard</Link>
          </li>
          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </nav>

      {/* Konten Dashboard */}
      <div className="dashboard-container">
        <h2>Dashboard Pegawai Gudang</h2>

        {/* Bagian Profil Pegawai Gudang */}
        <div className="dashboard-section">
          <h3>Profil Anda</h3>

          {pegawaiProfile ? (
            <div className="profile-details">
              <p>
                <strong>ID:</strong> {pegawaiProfile.id_pegawai}
              </p>
              <p>
                <strong>Nama:</strong> {pegawaiProfile.nama_pegawai}
              </p>
              <p>
                <strong>Email:</strong> {pegawaiProfile.email_pegawai}
              </p>
              <p>
                <strong>Nomor Telepon:</strong> {pegawaiProfile.no_telepon_pegawai}
              </p>
              <p>
                <strong>Tanggal Lahir:</strong> {pegawaiProfile.tgl_lahir_pegawai}
              </p>
              <p>
                <strong>Jabatan:</strong>{" "}
                {pegawaiProfile.jabatan?.nama_jabatan || "Tidak Ada"}
              </p>
            </div>
          ) : (
            <p>Profil tidak dapat dimuat.</p>
          )}
        </div>

        {/* Bagian tambahan bisa ditambahkan di sini */}
        {/* <div className="dashboard-section"> ... </div> */}
      </div>
    </div>
  );
};

export default DashboardPegawaiGudang;
