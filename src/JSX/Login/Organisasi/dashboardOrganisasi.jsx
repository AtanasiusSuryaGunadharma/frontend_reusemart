import React, { useEffect, useState } from "react";
import "./dashboardOrganisasi.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const DashboardOrganisasi = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orgProfile, setOrgProfile] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard"); // State untuk menu aktif
  const [currentPage, setCurrentPage] = useState(1); // State untuk halaman saat ini
  const itemsPerPage = 7; // Jumlah item per halaman

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

      setOrgProfile(profileRes.data);

      const res = await axios.get("http://127.0.0.1:8000/api/request-donasi", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allRequests = Array.isArray(res.data) ? res.data : res.data.data || [];
      const filteredRequests = allRequests.filter(
        (request) => request.organisasi_id === parseInt(id)
      );
      setRequests(filteredRequests);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "organisasi") {
      navigate("/generalLogin");
    } else {
      fetchData();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/generalLogin");
    toast.info("Anda telah logout.");
  };

  const handleEdit = (index) => {
    const item = filteredRequests[index];
    if (!item || !item.id_request_donasi) {
      toast.error("Data tidak valid untuk diedit.");
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
    if (!id) {
      toast.error("ID request tidak ditemukan.");
      return;
    }
    if (!window.confirm("Yakin ingin menghapus request ini?")) return;
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/request-donasi/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
      toast.success("Request berhasil dihapus.");
    } catch (err) {
      toast.error("Gagal menghapus data: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const id = editIndex !== null ? filteredRequests[editIndex]?.id_request_donasi : null;
    const url = editIndex !== null
      ? `http://127.0.0.1:8000/api/request-donasi/${id}`
      : `http://127.0.0.1:8000/api/request-donasi`;

    const method = editIndex !== null ? "put" : "post";

    if (!newRequest.alamat_req_donasi || !newRequest.request_barang_donasi || !newRequest.organisasi_id) {
      toast.error("Semua field wajib diisi.");
      return;
    }

    const data = {
      alamat_req_donasi: newRequest.alamat_req_donasi,
      request_barang_donasi: newRequest.request_barang_donasi,
      organisasi_id: newRequest.organisasi_id,
    };

    try {
      await axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      await fetchData();
      setShowModal(false);
      setNewRequest({
        alamat_req_donasi: "",
        request_barang_donasi: "",
        organisasi_id: localStorage.getItem("id_organisasi") || "",
      });
      setEditIndex(null);
      setCurrentPage(1); // Reset ke halaman 1 setelah submit
      toast.success(editIndex !== null ? "Request berhasil diperbarui." : "Request berhasil ditambahkan.");
    } catch (err) {
      toast.error("Gagal menyimpan data: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset ke halaman 1 saat pencarian berubah
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1); // Reset ke halaman 1 saat pencarian dihapus
  };

  const filteredRequests = requests.filter((r) =>
    r.request_barang_donasi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Logika paginasi
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Render konten utama berdasarkan menu aktif
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className="org-dashboard-section">
            <h3>Profil Organisasi</h3>
            {orgProfile ? (
              <div className="org-profile-details">
                <p>
                  <strong>ID:</strong> {orgProfile.id_organisasi}
                </p>
                <p>
                  <strong>Nama:</strong> {orgProfile.nama_organisasi}
                </p>
                <p>
                  <strong>Email:</strong> {orgProfile.email_organisasi}
                </p>
              </div>
            ) : (
              <p>Memuat profil...</p>
            )}
          </div>
        );
      case "requests":
        return (
          <div className="org-dashboard-section">
            <div className="org-section-header">
              <h3>Request Donasi Barang</h3>
              <button className="org-add-btn" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus"></i> Tambah Request
              </button>
            </div>

            <div className="org-search-container">
              <i className="fas fa-search org-search-icon"></i>
              <input
                type="text"
                className="org-search-input"
                placeholder="Cari berdasarkan request barang..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button className="org-clear-search" onClick={clearSearch}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {searchTerm && (
              <div className="org-search-results-info">
                Menampilkan {filteredRequests.length} dari {requests.length} request
              </div>
            )}

            {loading ? (
              <div className="org-loading-container">
                <div className="org-loading-spinner"></div>
                <p>Memuat data...</p>
              </div>
            ) : error ? (
              <div className="org-error-message">
                <i className="fas fa-exclamation-circle"></i>
                <p>{error}</p>
              </div>
            ) : currentItems.length > 0 ? (
              <div className="org-request-table-container">
                <table className="org-request-table">
                  <thead>
                    <tr>
                      <th>Alamat</th>
                      <th>Request Barang</th>
                      <th>Organisasi ID</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr key={item.id_request_donasi || index}>
                        <td>{item.alamat_req_donasi}</td>
                        <td>{item.request_barang_donasi}</td>
                        <td>{item.organisasi_id}</td>
                        <td className="org-action-buttons">
                          <button
                            className="org-edit-btn"
                            onClick={() => handleEdit(index)}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button
                            className="org-delete-btn"
                            onClick={() => handleDelete(item.id_request_donasi)}
                          >
                            <i className="fas fa-trash-alt"></i> Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginasi */}
                <div className="org-pagination">
                  <button
                    className="org-paginate-btn"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      className={`org-paginate-btn ${currentPage === number ? "org-active" : ""}`}
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    className="org-paginate-btn"
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="org-no-data-container">
                <div className="org-no-data-icon">
                  <i className="fas fa-box-open"></i>
                </div>
                <p>Belum ada permintaan donasi barang.</p>
                <button className="org-add-btn-empty" onClick={() => setShowModal(true)}>
                  <i className="fas fa-plus"></i> Tambah Request Pertama
                </button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="org-loading-container">Memuat Dashboard...</div>;
  if (error) return <div className="org-error-state">Error: {error}</div>;

  return (
    <div className="org-dashboard">
      {/* Sidebar kiri */}
      <aside className="org-sidebar">
        <div className="org-sidebar-logo">REUSEMART ORG</div>
        <nav className="org-sidebar-nav">
          <ul>
            <li
              className={activeMenu === "dashboard" ? "org-active" : ""}
              onClick={() => setActiveMenu("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={activeMenu === "requests" ? "org-active" : ""}
              onClick={() => setActiveMenu("requests")}
            >
              Request Donasi Barang
            </li>
            <li onClick={handleLogout} className="org-logout-btn">
              Logout
            </li>
          </ul>
        </nav>
      </aside>

      {/* Konten utama */}
      <main className="org-dashboard-container">
        <h2>
          {activeMenu === "dashboard"
            ? "Dashboard Organisasi"
            : "Request Donasi Barang"}
        </h2>
        <p className="org-welcome-text">
          Selamat datang, {orgProfile?.nama_organisasi || "Organisasi"}
        </p>
        {renderContent()}

        {/* Modal */}
        {showModal && (
          <div className="org-modal">
            <div className="org-modal-content">
              <div className="org-modal-header">
                <h3>{editIndex !== null ? "Edit Request" : "Tambah Request"}</h3>
                <button className="org-close-btn" onClick={() => setShowModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="org-form-grid">
                  <div className="org-form-group">
                    <label>
                      <i className="fas fa-map-marker-alt"></i> Alamat Request Donasi
                    </label>
                    <input
                      type="text"
                      value={newRequest.alamat_req_donasi}
                      onChange={(e) =>
                        setNewRequest({ ...newRequest, alamat_req_donasi: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="org-form-group">
                    <label>
                      <i className="fas fa-box"></i> Request Barang Donasi
                    </label>
                    <input
                      type="text"
                      value={newRequest.request_barang_donasi}
                      onChange={(e) =>
                        setNewRequest({ ...newRequest, request_barang_donasi: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="org-form-group">
                    <label>
                      <i className="fas fa-building"></i> Organisasi ID
                    </label>
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
                <div className="org-modal-actions">
                  <button
                    type="button"
                    className="org-cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    <i className="fas fa-times"></i> Batal
                  </button>
                  <button type="submit" className="org-submit-btn">
                    <i className="fas fa-save"></i>{" "}
                    {editIndex !== null ? "Perbarui" : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
};

export default DashboardOrganisasi;