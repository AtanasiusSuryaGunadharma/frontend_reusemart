import React, { useState, useEffect } from "react";
import "./dashboardPenitip.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';

const PenitipDashboard = () => {
  // State untuk profil Penitip (sama seperti sebelumnya)
  const [penitipProfile, setPenitipProfile] = useState(null);
  // State BARU untuk menyimpan histori transaksi penitipan
  const [consignmentHistory, setConsignmentHistory] = useState([]);

  // State indikator loading dan error
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

    navigate("/generalLogin");
    toast.info("Anda telah logout.");
  };

  // Fetch profil Penitip
  const fetchPenitipProfile = async (token, penitipId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/penitip/${penitipId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPenitipProfile(response.data);
    } catch (err) {
      console.error("Error fetching penitip profile:", err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  // Fetch histori transaksi penitipan
  const fetchConsignmentHistory = async (token) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/transaksi-penitipan/my-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched Consignment History:", response.data);
      setConsignmentHistory(response.data);
    } catch (err) {
      console.error("Error fetching consignment history:", err.response?.data || err.message);
      setError("Gagal memuat histori transaksi.");
      if (err.response?.status === 401) handleLogout();
    }
  };

  // useEffect untuk memuat data saat komponen mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const penitipId = localStorage.getItem("id_penitip");
    const userRole = localStorage.getItem("userRole");

    if (!token || !penitipId || userRole !== 'penitip') {
      navigate("/generalLogin");
      toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      await fetchPenitipProfile(token, penitipId);
      await fetchConsignmentHistory(token);

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="loading-state">Memuat Dashboard...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
      <div className="penitip-dashboard-page">
        <nav className="navbar">
          <div className="logo">
            <span>REUSEMART PENITIP</span>
          </div>
          <ul className="nav-links">
            <li><Link to="/penitip/dashboard">Dashboard</Link></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </ul>
        </nav>

        <div className="dashboard-container">
          <h2>Dashboard Penitip</h2>

          <div className="dashboard-section">
            <h3>Profil Anda</h3>
            {penitipProfile ? (
              <table className="profile-table">
                <tbody>
                  <tr><td><strong>ID</strong></td><td>{penitipProfile.id_penitip}</td></tr>
                  <tr><td><strong>Nama</strong></td><td>{penitipProfile.nama_penitip}</td></tr>
                  <tr><td><strong>Email</strong></td><td>{penitipProfile.email_penitip}</td></tr>
                  <tr><td><strong>No Telepon</strong></td><td>{penitipProfile.no_telepon_penitip}</td></tr>
                  <tr><td><strong>Tanggal Lahir</strong></td><td>{penitipProfile.tgl_lahir_penitip}</td></tr>
                  <tr><td><strong>Rating</strong></td><td>{penitipProfile.rating_penitip}</td></tr>
                  <tr><td><strong>Saldo</strong></td><td>Rp. {penitipProfile.pendapatan_penitip}</td></tr>
                  <tr><td><strong>Bonus Terjual Cepat</strong></td><td>Rp. {penitipProfile.bonus_terjual_cepat}</td></tr>
                  <tr><td><strong>Reward Sosial</strong></td><td>Rp. {penitipProfile.reward_program_sosial}</td></tr>
                </tbody>
              </table>
            ) : (
              <p>Profil tidak dapat dimuat.</p>
            )}
          </div>


          <div className="dashboard-section">
            <h3>History Transaksi Penitipan</h3>

            {consignmentHistory.length > 0 ? (
              consignmentHistory.map(transaction => (
                <div key={transaction.id_penitipan_transaksi} className="transaction-table-wrapper">
                  <h4>ID Transaksi: {transaction.id_penitipan_transaksi}</h4>
                  <table className="transaction-table">
                    <thead>
                      <tr>
                        <th>Tanggal Mulai</th>
                        <th>Tanggal Akhir</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{transaction.tanggal_mulai_penitipan}</td>
                        <td>{transaction.tanggal_akhir_penitipan}</td>
                        <td>{transaction.status_penitipan}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h5>Detail Barang</h5>
                  <table className="transaction-detail-table">
                    <thead>
                      <tr>
                        <th>Nama Barang</th>
                        <th>Jumlah Titip</th>
                        <th>Terjual</th>
                        <th>Gagal Terjual</th>
                        <th>Bonus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaction.detail_transaksi_penitipans?.length > 0 ? (
                        transaction.detail_transaksi_penitipans.map(detail => (
                          <tr key={detail.id_penitipan_detail_transaksi}>
                            <td>{detail.barang?.nama_barang || 'N/A'}</td>
                            <td>{detail.jumlah_barang_penitip}</td>
                            <td>{detail.jumlah_item_terjual}</td>
                            <td>{detail.jumlah_item_gagal_terjual}</td>
                            <td>Rp. {detail.bonus_terjual_cepat}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">Tidak ada detail barang.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <p>Belum ada histori transaksi penitipan.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

export default PenitipDashboard;
