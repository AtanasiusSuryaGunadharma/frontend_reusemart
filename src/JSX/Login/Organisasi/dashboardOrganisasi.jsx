import React, { useEffect, useState } from "react";
import "./dashboardOrganisasi.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DashboardOrganisasi = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orgProfile, setOrgProfile] = useState(null);

  const [newRequest, setNewRequest] = useState({
    alamat_req_donasi: "",
    request_barang_donasi: "",
    organisasi_id: localStorage.getItem("id_organisasi") || "",
  });

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const id = localStorage.getItem("id_organisasi");

      if (!token || !id) {
        throw new Error("Token atau ID organisasi tidak ditemukan. Silakan login kembali.");
      }

      const profileRes = await axios.get(`http://127.0.0.1:8000/api/organisasi/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Profile Response:", profileRes.data);
      setOrgProfile(profileRes.data);

      const res = await axios.get("http://127.0.0.1:8000/api/request-donasi", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Requests Response:", res.data);
      const allRequests = Array.isArray(res.data) ? res.data : res.data.data || [];
      const filteredRequests = allRequests.filter(
        (request) => request.organisasi_id === parseInt(id)
      );
      setRequests(filteredRequests);
    } catch (err) {
      console.error("Fetch Data Error:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || "Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "organisasi") {
      navigate("/organisasi/login");
    } else {
      fetchData();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/organisasi/login");
  };

  const handleEdit = (index) => {
    const item = requests[index];
    console.log("Edit Item:", item); // Debugging
    if (!item || !item.id) {
      alert("Data tidak valid untuk diedit. Periksa struktur data (id hilang).");
      return;
    }
    setEditIndex(index);
    setNewRequest({
      alamat_req_donasi: item.alamat_req_donasi || "",
      request_barang_donasi: item.request_barang_donasi || "",
      organisasi_id: item.organisasi_id || localStorage.getItem("id_organisasi") || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    console.log("Delete ID:", id); // Debugging
    if (!id) {
      alert("ID request tidak ditemukan. Periksa struktur data.");
      return;
    }
    if (!window.confirm("Yakin ingin menghapus request ini?")) return;
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.delete(`http://127.0.0.1:8000/api/request-donasi/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Delete Response:", res.data);
      await fetchData(); // Muat ulang data setelah hapus
    } catch (err) {
      console.error("Delete Error:", err.response ? err.response.data : err.message);
      alert("Gagal menghapus data: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const id = editIndex !== null ? requests[editIndex]?.id : null;
    const url = editIndex !== null
      ? `http://127.0.0.1:8000/api/request-donasi/${id}`
      : `http://127.0.0.1:8000/api/request-donasi`;

    const method = editIndex !== null ? "put" : "post";

    const formData = new FormData();
    formData.append("alamat_req_donasi", newRequest.alamat_req_donasi);
    formData.append("request_barang_donasi", newRequest.request_barang_donasi);
    formData.append("organisasi_id", newRequest.organisasi_id);

    try {
      console.log("Sending Request:", { method, url, data: Object.fromEntries(formData) });
      const res = await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Submit Response:", res.data);
      await fetchData(); // Muat ulang data setelah simpan

      setShowModal(false);
      setNewRequest({
        alamat_req_donasi: "",
        request_barang_donasi: "",
        organisasi_id: localStorage.getItem("id_organisasi") || "",
      });
      setEditIndex(null);
    } catch (err) {
      console.error("Submit Error:", err.response ? err.response.data : err.message);
      alert("Gagal menyimpan data: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.request_barang_donasi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="cs-dashboard">
      <nav className="navbar">
        <div className="logo">
          <span>ReUseMart</span>
        </div>
        <ul className="nav-links">
          <li>
            <button onClick={handleLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i> Keluar
            </button>
          </li>
        </ul>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Dashboard Organisasi</h2>
          <p className="welcome-text">
            Selamat datang, {orgProfile?.nama_organisasi || "Organisasi"}
          </p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3>Profil Organisasi</h3>
            </div>
            {orgProfile && (
              <div className="profile-card">
                <div className="profile-info">
                  <div className="info-item">
                    <span className="info-label">ID</span>
                    <span className="info-value">{orgProfile.id_organisasi}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Nama</span>
                    <span className="info-value">{orgProfile.nama_organisasi}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{orgProfile.email_organisasi}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-panel penitip-panel">
            <div className="panel-header">
              <h3>Request Donasi Barang</h3>
              <button className="add-btn" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus"></i> Tambah Request
              </button>
            </div>

            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Cari berdasarkan request barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Memuat data...</p>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredRequests.length > 0 ? (
              <div className="penitip-table-container">
                <table className="penitip-table">
                  <thead>
                    <tr>
                      <th>Alamat</th>
                      <th>Request Barang</th>
                      <th>Organisasi ID</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{item.alamat_req_donasi}</td>
                        <td>{item.request_barang_donasi}</td>
                        <td>{item.organisasi_id}</td>
                        <td className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEdit(index)}>
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                            <i className="fas fa-trash-alt"></i> Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-container">
                <p>Belum ada permintaan donasi barang.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editIndex !== null ? "Edit Request" : "Tambah Request"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Alamat Request Donasi</label>
                  <input
                    type="text"
                    value={newRequest.alamat_req_donasi}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, alamat_req_donasi: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Request Barang Donasi</label>
                  <input
                    type="text"
                    value={newRequest.request_barang_donasi}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, request_barang_donasi: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Organisasi ID</label>
                  <input
                    type="text"
                    value={newRequest.organisasi_id}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, organisasi_id: e.target.value })
                    }
                    required
                    disabled
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="submit-btn">
                  {editIndex !== null ? "Perbarui" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOrganisasi;