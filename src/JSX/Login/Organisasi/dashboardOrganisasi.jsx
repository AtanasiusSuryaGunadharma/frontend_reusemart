// DashboardOrganisasi.jsx
import React, { useEffect, useState } from "react";
import "./dashboardOrganisasi.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DashboardOrganisasi = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orgProfile, setOrgProfile] = useState(null);

  const [newRequest, setNewRequest] = useState({
    nama_barang: "",
    jumlah: "",
    kategori: "",
    deskripsi: "",
    status: "pending",
    foto_barang: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "organisasi") {
      navigate("/login");
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const id = localStorage.getItem("id_organisasi");

        const profileRes = await axios.get(`http://127.0.0.1:8000/api/organisasi/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrgProfile(profileRes.data);

        const res = await axios.get("http://127.0.0.1:8000/api/request-donasi-barang", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(Array.isArray(res.data) ? res.data : res.data.data || []);
      } catch (err) {
        setError("Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewRequest({ ...newRequest, foto_barang: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleEdit = (index) => {
    const item = requests[index];
    setEditIndex(index);
    setNewRequest({
      nama_barang: item.nama_barang,
      jumlah: item.jumlah,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      status: item.status,
      foto_barang: null,
    });
    if (item.foto_barang) {
      setPreviewImage(`http://127.0.0.1:8000/storage/${item.foto_barang.replace("public/", "")}`);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus request ini?")) return;
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/request-donasi-barang/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(requests.filter((r) => r.id !== id));
    } catch {
      alert("Gagal menghapus data.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const url = editIndex !== null
      ? `http://127.0.0.1:8000/api/request-donasi-barang/${requests[editIndex].id}`
      : `http://127.0.0.1:8000/api/request-donasi-barang`;

    const method = editIndex !== null ? "put" : "post";

    const formData = new FormData();
    Object.entries(newRequest).forEach(([key, value]) => {
      if (value || key !== "foto_barang") {
        formData.append(key, value);
      }
    });

    try {
      const res = await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedItem = res.data;

      if (editIndex !== null) {
        const updated = [...requests];
        updated[editIndex] = updatedItem;
        setRequests(updated);
      } else {
        setRequests([...requests, updatedItem]);
      }

      setShowModal(false);
      setNewRequest({
        nama_barang: "",
        jumlah: "",
        kategori: "",
        deskripsi: "",
        status: "pending",
        foto_barang: null,
      });
      setEditIndex(null);
      setPreviewImage(null);
    } catch {
      alert("Gagal menyimpan data.");
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase())
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
                placeholder="Cari berdasarkan nama barang..."
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
                      <th>Nama Barang</th>
                      <th>Jumlah</th>
                      <th>Kategori</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((item, index) => (
                      <tr key={item.id}>
                        <td>{item.nama_barang}</td>
                        <td>{item.jumlah}</td>
                        <td>{item.kategori}</td>
                        <td>{item.status}</td>
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

      {/* Modal */}
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
                  <label>Nama Barang</label>
                  <input
                    type="text"
                    value={newRequest.nama_barang}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, nama_barang: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Jumlah</label>
                  <input
                    type="number"
                    value={newRequest.jumlah}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, jumlah: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <input
                    type="text"
                    value={newRequest.kategori}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, kategori: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Deskripsi</label>
                  <input
                    type="text"
                    value={newRequest.deskripsi}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, deskripsi: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newRequest.status}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, status: e.target.value })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="disetujui">Disetujui</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>
                <div className="form-group foto-ktp-container">
                  <label>Foto Barang</label>
                  <input type="file" onChange={handleFileChange} accept="image/*" />
                  {previewImage && (
                    <div className="image-preview">
                      <img src={previewImage} alt="Preview" />
                    </div>
                  )}
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
