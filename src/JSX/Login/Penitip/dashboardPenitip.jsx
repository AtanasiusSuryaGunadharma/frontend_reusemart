import React, { useState, useEffect } from "react";
import "./dashboardPenitip.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const PenitipDashboard = () => {
  const [penitipProfile, setPenitipProfile] = useState(null);
  const [consignmentHistory, setConsignmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard"); // State untuk menu aktif
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1); // State untuk halaman history
  const itemsPerPage = 7; // Jumlah item per halaman

  const navigate = useNavigate();

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

  const fetchPenitipProfile = async (token, penitipId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/penitip/${penitipId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Profile:", response.data); // Log data profil
      setPenitipProfile(response.data);
    } catch (err) {
      console.error("Error fetching penitip profile:", err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchConsignmentHistory = async (token) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/transaksi-penitipan/my-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched Consignment History:", response.data); // Log data history
      setConsignmentHistory(response.data);
    } catch (err) {
      console.error("Error fetching consignment history:", err.response?.data || err.message);
      setError("Gagal memuat histori transaksi.");
      if (err.response?.status === 401) handleLogout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const penitipId = localStorage.getItem("id_penitip");
    const userRole = localStorage.getItem("userRole");

    if (!token || !penitipId || userRole !== "penitip") {
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

  if (loading) return <div className="penitip-loading-state">Memuat Dashboard...</div>;
  if (error) return <div className="penitip-error-state">Error: {error}</div>;

  // Logika paginasi untuk history transaksi
  const indexOfLastHistory = currentHistoryPage * itemsPerPage;
  const indexOfFirstHistory = indexOfLastHistory - itemsPerPage;
  const currentHistory = consignmentHistory.slice(indexOfFirstHistory, indexOfLastHistory);
  const totalHistoryPages = Math.ceil(consignmentHistory.length / itemsPerPage);

  const paginateHistory = (pageNumber) => setCurrentHistoryPage(pageNumber);
  const nextHistoryPage = () => {
    if (currentHistoryPage < totalHistoryPages) setCurrentHistoryPage(currentHistoryPage + 1);
  };
  const prevHistoryPage = () => {
    if (currentHistoryPage > 1) setCurrentHistoryPage(currentHistoryPage - 1);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className="penitip-dashboard-section">
            <h3>Profil Anda</h3>
            {penitipProfile ? (
              <table className="penitip-profile-table">
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
        );
      case "history":
        return (
          <div className="penitip-dashboard-section">
            <h3>History Transaksi Penitipan</h3>
            {consignmentHistory.length > 0 ? (
              <>
                {currentHistory.map((transaction) => (
                  <div key={transaction.id_penitipan_transaksi || Math.random()} className="penitip-transaction-table-wrapper">
                    <h4>ID Transaksi: {transaction.id_penitipan_transaksi}</h4>
                    <table className="penitip-transaction-table">
                      <thead>
                        <tr>
                          <th>Tanggal Mulai</th>
                          <th>Tanggal Akhir</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{transaction.tanggal_mulai_penitipan || "Tidak Diketahui"}</td>
                          <td>{transaction.tanggal_akhir_penitipan || "Tidak Diketahui"}</td>
                          <td>{transaction.status_penitipan || "Tidak Diketahui"}</td>
                        </tr>
                      </tbody>
                    </table>

                    <h5>Detail Barang</h5>
                    <table className="penitip-transaction-detail-table">
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
                          transaction.detail_transaksi_penitipans.map((detail) => (
                            <tr key={detail.id_penitipan_detail_transaksi || Math.random()}>
                              <td>{detail.barang?.nama_barang || "N/A"}</td>
                              <td>{detail.jumlah_barang_penitip || 0}</td>
                              <td>{detail.jumlah_item_terjual || 0}</td>
                              <td>{detail.jumlah_item_gagal_terjual || 0}</td>
                              <td>Rp. {detail.bonus_terjual_cepat || 0}</td>
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
                ))}
                <div className="penitip-pagination">
                  <button
                    className="penitip-paginate-btn"
                    onClick={prevHistoryPage}
                    disabled={currentHistoryPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      className={`penitip-paginate-btn ${currentHistoryPage === number ? "penitip-active" : ""}`}
                      onClick={() => paginateHistory(number)}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    className="penitip-paginate-btn"
                    onClick={nextHistoryPage}
                    disabled={currentHistoryPage === totalHistoryPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p>Belum ada histori transaksi penitipan.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="penitip-dashboard">
      <aside className="penitip-sidebar">
        <div className="penitip-sidebar-logo">REUSEMART PENITIP</div>
        <nav className="penitip-sidebar-nav">
          <ul>
            <li
              className={activeMenu === "dashboard" ? "penitip-active" : ""}
              onClick={() => setActiveMenu("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={activeMenu === "history" ? "penitip-active" : ""}
              onClick={() => setActiveMenu("history")}
            >
              History Transaksi
            </li>
            <li onClick={handleLogout} className="penitip-logout-btn">
              Logout
            </li>
          </ul>
        </nav>
      </aside>

      <main className="penitip-dashboard-container">
        <h2>
          {activeMenu === "dashboard"
            ? "Dashboard Penitip"
            : "History Transaksi Penitipan"}
        </h2>
        <p className="penitip-welcome-text">
          Selamat datang, {penitipProfile?.nama_penitip || "Penitip"}
        </p>
        {renderContent()}
      </main>
    </div>
  );
};

export default PenitipDashboard;