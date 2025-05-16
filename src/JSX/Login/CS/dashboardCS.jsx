/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./dashboardCS.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const CSDashboard = () => {
  const [penitip, setPenitip] = useState([]);
  const [csProfile, setCSProfile] = useState(null);
  const [allDiscussions, setAllDiscussions] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyFormData, setReplyFormData] = useState({
    komentar_pegawai: '',
    discussion_id: null,
  });
  const [replyingDiscussion, setReplyingDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newPenitip, setNewPenitip] = useState({
    nama_penitip: "",
    email_penitip: "",
    password_penitip: "",
    tgl_lahir_penitip: "",
    no_telepon_penitip: "",
    nik_penitip: "",
    foto_ktp_penitip: null,
    rating_penitip: 0,
    pendapatan_penitip: 0,
    bonus_terjual_cepat: 0,
    reward_program_sosial: 0,
  });
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const id_pegawai = localStorage.getItem("id_pegawai");
    const userRole = localStorage.getItem("userRole");

    if (!token || !userRole || !['cs', 'manager', 'admin'].includes(userRole)) {
      navigate("/generalLogin");
      toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const profileResponse = await axios.get(`http://127.0.0.1:8000/api/pegawai/${id_pegawai}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCSProfile(profileResponse.data);

        const penitipResponse = await axios.get("http://127.0.0.1:8000/api/penitip", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(penitipResponse.data)) {
          setPenitip(penitipResponse.data);
        } else if (penitipResponse.data && Array.isArray(penitipResponse.data.data)) {
          setPenitip(penitipResponse.data.data);
        } else {
          console.error("Unexpected data format:", penitipResponse.data);
          setError("Format data penitip tidak valid");
        }

        await fetchAllDiscussions(token);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Gagal memuat data awal.");
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    if (token && userRole && ['cs', 'manager', 'admin'].includes(userRole)) {
      fetchData();
    }
  }, [navigate]);

  const fetchAllDiscussions = async (token, search = '') => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/diskusi-produk`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search }
      });
      console.log("Fetched All Discussions (CS):", response.data);
      if (Array.isArray(response.data)) {
        setAllDiscussions(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setAllDiscussions(response.data.data);
      } else {
        console.error("Unexpected discussion data format:", response.data);
        setAllDiscussions([]);
      }
    } catch (err) {
      console.error("Error fetching all discussions:", err.response?.data || err.message);
      toast.error("Gagal memuat daftar diskusi.");
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPenitip({ ...newPenitip, foto_ktp_penitip: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleAddOrUpdatePenitip = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const url = editId !== null 
      ? `http://127.0.0.1:8000/api/penitip/${editId}` 
      : "http://127.0.0.1:8000/api/penitip";
    const method = editId !== null ? "put" : "post";

    if (editId === null) {
      if (!newPenitip.nama_penitip || !newPenitip.email_penitip || !newPenitip.password_penitip || 
          !newPenitip.tgl_lahir_penitip || !newPenitip.no_telepon_penitip || !newPenitip.nik_penitip) {
        alert("Semua field wajib diisi: Nama, Email, Password, Tanggal Lahir, No Telepon, dan NIK.");
        return;
      }
      const nikRegex = /^[0-9]{16}$/;
      if (!nikRegex.test(newPenitip.nik_penitip)) {
        alert("NIK harus terdiri dari 16 digit angka.");
        return;
      }
      const phoneRegex = /^[0-9\+-]+$/;
      if (!phoneRegex.test(newPenitip.no_telepon_penitip)) {
        alert("Nomor telepon hanya boleh berisi angka, tanda +, atau tanda -.");
        return;
      }
    }

    try {
      if (newPenitip.foto_ktp_penitip) {
        const formData = new FormData();
        if (newPenitip.nama_penitip) formData.append("nama_penitip", newPenitip.nama_penitip);
        if (newPenitip.email_penitip) formData.append("email_penitip", newPenitip.email_penitip);
        if (newPenitip.password_penitip) formData.append("password_penitip", newPenitip.password_penitip);
        if (newPenitip.tgl_lahir_penitip) formData.append("tgl_lahir_penitip", newPenitip.tgl_lahir_penitip);
        if (newPenitip.no_telepon_penitip) formData.append("no_telepon_penitip", newPenitip.no_telepon_penitip);
        if (newPenitip.nik_penitip) formData.append("nik_penitip", newPenitip.nik_penitip);
        formData.append("rating_penitip", newPenitip.rating_penitip || 0);
        formData.append("pendapatan_penitip", newPenitip.pendapatan_penitip || 0);
        formData.append("bonus_terjual_cepat", newPenitip.bonus_terjual_cepat || 0);
        formData.append("reward_program_sosial", newPenitip.reward_program_sosial || 0);
        formData.append("foto_ktp_penitip", newPenitip.foto_ktp_penitip);

        console.log("Sending FormData:", Object.fromEntries(formData));

        const response = await axios({
          method: method,
          url: url,
          data: formData,
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          },
        });

        if (editId !== null) {
          setPenitip(penitip.map((item) => 
            item.id_penitip === editId ? { ...item, ...response.data } : item
          ));
        } else {
          setPenitip([...penitip, response.data]);
        }
      } else {
        const data = {};
        if (newPenitip.nama_penitip) data.nama_penitip = newPenitip.nama_penitip;
        if (newPenitip.email_penitip) data.email_penitip = newPenitip.email_penitip;
        if (newPenitip.password_penitip) data.password_penitip = newPenitip.password_penitip;
        if (newPenitip.tgl_lahir_penitip) data.tgl_lahir_penitip = newPenitip.tgl_lahir_penitip;
        if (newPenitip.no_telepon_penitip) data.no_telepon_penitip = newPenitip.no_telepon_penitip;
        if (newPenitip.nik_penitip) data.nik_penitip = newPenitip.nik_penitip;
        data.rating_penitip = newPenitip.rating_penitip || 0;
        data.pendapatan_penitip = newPenitip.pendapatan_penitip || 0;
        data.bonus_terjual_cepat = newPenitip.bonus_terjual_cepat || 0;
        data.reward_program_sosial = newPenitip.reward_program_sosial || 0;

        console.log("Sending JSON Data:", data);

        const response = await axios({
          method: method,
          url: url,
          data: data,
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (editId !== null) {
          setPenitip(penitip.map((item) => 
            item.id_penitip === editId ? { ...item, ...response.data } : item
          ));
        } else {
          setPenitip([...penitip, response.data]);
        }
      }

      handleCloseModal();
      toast.success(editId !== null ? "Data penitip diperbarui" : "Penitip baru ditambahkan");
    } catch (err) {
      console.error("Error Adding/Updating Penitip:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || "Terjadi kesalahan";
      const errorDetails = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(", ")
        : err.message;
      toast.error(`Gagal menambahkan/memperbarui data penitip: ${errorMessage}. Detail: ${errorDetails}`);
    }
  };

  const handleDeletePenitip = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus penitip ini?")) {
      return;
    }
    
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/penitip/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPenitip(penitip.filter((emp) => emp.id_penitip !== id));
      toast.success("Penitip berhasil dihapus");
    } catch (err) {
      console.error("Error Deleting Penitip:", err);
      toast.error("Gagal menghapus penitip. Silakan coba lagi.");
    }
  };

  const handleEditPenitip = (id) => {
    const penitipToEdit = penitip.find(p => p.id_penitip === id);
    if (penitipToEdit) {
      setEditId(id);
      let formattedDate = "";
      if (penitipToEdit.tgl_lahir_penitip) {
        formattedDate = new Date(penitipToEdit.tgl_lahir_penitip).toISOString().split("T")[0];
      }
      setNewPenitip({
        nama_penitip: penitipToEdit.nama_penitip || "",
        email_penitip: penitipToEdit.email_penitip || "",
        password_penitip: "",
        tgl_lahir_penitip: formattedDate,
        no_telepon_penitip: penitipToEdit.no_telepon_penitip || "",
        nik_penitip: penitipToEdit.nik_penitip || "",
        foto_ktp_penitip: null,
        rating_penitip: penitipToEdit.rating_penitip || 0,
        pendapatan_penitip: penitipToEdit.pendapatan_penitip || 0,
        bonus_terjual_cepat: penitipToEdit.bonus_terjual_cepat || 0,
        reward_program_sosial: penitipToEdit.reward_program_sosial || 0,
      });
      setPreviewImage(penitipToEdit.foto_ktp_penitip ? 
        `http://127.0.0.1:8000/storage/${penitipToEdit.foto_ktp_penitip.replace('public/', '')}` : 
        null);
      setShowModal(true);
    }
  };

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

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setPreviewImage(null);
    setNewPenitip({
      nama_penitip: "",
      email_penitip: "",
      password_penitip: "",
      tgl_lahir_penitip: "",
      no_telepon_penitip: "",
      nik_penitip: "",
      foto_ktp_penitip: null,
      rating_penitip: 0,
      pendapatan_penitip: 0,
      bonus_terjual_cepat: 0,
      reward_program_sosial: 0,
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const filteredPenitip = penitip.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.nama_penitip && item.nama_penitip.toLowerCase().includes(searchLower)) ||
      (item.email_penitip && item.email_penitip.toLowerCase().includes(searchLower)) ||
      (item.no_telepon_penitip && item.no_telepon_penitip.toLowerCase().includes(searchLower)) ||
      (item.nik_penitip && item.nik_penitip.toLowerCase().includes(searchLower))
    );
  });

  const highlightMatch = (text, term) => {
    if (!term || !text) return text;
    const parts = text.toString().split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === term.toLowerCase() ? 
        <span key={index} className="search-highlight">{part}</span> : part
    );
  };

  const handleReplyClick = (discussion) => {
    setReplyingDiscussion(discussion);
    setReplyFormData({
      komentar_pegawai: discussion.komentar_pegawai || '',
      discussion_id: discussion.id_diskusi,
    });
    setShowReplyModal(true);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!replyingDiscussion || !replyFormData.discussion_id) {
      toast.error("Data diskusi tidak valid.");
      return;
    }
    if (!replyFormData.komentar_pegawai.trim()) {
      toast.error("Balasan tidak boleh kosong.");
      return;
    }

    const payload = {
      komentar_pegawai: replyFormData.komentar_pegawai,
    };

    try {
      const response = await axios.put(`http://127.0.0.1:8000/api/diskusi-produk/${replyFormData.discussion_id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Reply submitted successfully:", response.data);
      toast.success(response.data.message || "Balasan berhasil dikirim.");

      const currentToken = localStorage.getItem('authToken');
      if (currentToken) {
        await fetchAllDiscussions(currentToken);
      }

      handleCloseReplyModal();
    } catch (err) {
      console.error("Error submitting reply:", err.response?.data || err.message);
      const backendErrorMessage = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Gagal mengirim balasan.');
      toast.error(backendErrorMessage);
    }
  };

  const handleCloseReplyModal = () => {
    setShowReplyModal(false);
    setReplyingDiscussion(null);
    setReplyFormData({ komentar_pegawai: '', discussion_id: null });
  };

  if (loading) return <div className="loading-container">Memuat Dashboard...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="cs-dashboard">
      <nav className="navbar">
        <div className="logo">
          <span>ReUseMart CS</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/cs/dashboard">Dashboard</Link></li>
          <li><button onClick={handleLogout} className="logout-btn"><i className="fas fa-sign-out-alt"></i>Keluar</button></li>
        </ul>
      </nav>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Dashboard Customer Service</h2>
          <p className="welcome-text">Selamat datang, {csProfile?.nama_pegawai || "Customer Service"}</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <h3>Daftar Diskusi Produk</h3>
            </div>
            <div className="discussion-table-container">
              {allDiscussions.length > 0 ? (
                <table className="discussion-table">
                  <thead>
                    <tr>
                      <th>Barang</th>
                      <th>Pembeli</th>
                      <th>Komentar Pembeli</th>
                      <th>Balasan CS</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDiscussions.map(discussion => (
                      <tr key={discussion.id_diskusi}>
                        <td className="product-cell">
                          <div className="product-info-cell">
                            {discussion.barang?.image && (
                              <img
                                src={`http://127.0.0.1:8000/images/${discussion.barang.image}`}
                                alt={discussion.barang.nama_barang || 'Barang'}
                                className="product-image-small"
                              />
                            )}
                            <span>{discussion.barang?.nama_barang || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <strong>Nama:</strong> {discussion.pembeli?.nama_pembeli || 'N/A'}<br />
                          <strong>Email:</strong> {discussion.pembeli?.email_pembeli || 'N/A'}
                        </td>
                        <td>{discussion.komentar_pembeli}</td>
                        <td>
                          {discussion.komentar_pegawai ? (
                            <div>
                              <strong>Oleh:</strong> {discussion.pegawai?.nama_pegawai || 'N/A'}<br />
                              {discussion.komentar_pegawai}
                            </div>
                          ) : (
                            <em className="cs-reply-pending">Belum ada balasan.</em>
                          )}
                        </td>
                        <td className="action-buttons">
                          <button
                            className="reply-btn"
                            onClick={() => handleReplyClick(discussion)}
                          >
                            Balas
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data-message">Tidak ada diskusi produk saat ini.</p>
              )}
            </div>
          </div>

          <div className="dashboard-panel penitip-panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <h3>Manajemen Penitip</h3>
              <button className="add-btn" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus"></i> Tambah Penitip
              </button>
            </div>
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Cari penitip berdasarkan nama, email, telepon, atau NIK" 
                className="search-input"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button className="clear-search" onClick={clearSearch}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {searchTerm && (
              <div className="search-results-info">
                Menampilkan {filteredPenitip.length} dari {penitip.length} penitip
              </div>
            )}

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Memuat data penitip...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                <p>{error}</p>
              </div>
            ) : filteredPenitip.length > 0 ? (
              <div className="penitip-table-container">
                <table className="penitip-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Telepon</th>
                      <th>NIK</th>
                      <th>Tanggal Lahir</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPenitip.map((item) => (
                      <tr key={item.id_penitip}>
                        <td>{highlightMatch(item.nama_penitip, searchTerm)}</td>
                        <td>{highlightMatch(item.email_penitip, searchTerm)}</td>
                        <td>{highlightMatch(item.no_telepon_penitip, searchTerm)}</td>
                        <td>{highlightMatch(item.nik_penitip, searchTerm)}</td>
                        <td>
                          {item.tgl_lahir_penitip
                            ? new Date(item.tgl_lahir_penitip).toLocaleDateString('id-ID')
                            : '-'}
                        </td>
                        <td className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEditPenitip(item.id_penitip)}>
                            <i className="fas fa-edit">Edit</i>
                          </button>
                          <button className="delete-btn" onClick={() => handleDeletePenitip(item.id_penitip)}>
                            <i className="fas fa-trash-alt">Hapus</i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-container">
                <div className="no-data-icon">
                  <i className="fas fa-users-slash"></i>
                </div>
                <p>Belum ada data penitip</p>
                <button className="add-btn-empty" onClick={() => setShowModal(true)}>
                  <i className="fas fa-plus"></i> Tambah Penitip Pertama
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editId !== null ? "Edit Data Penitip" : "Tambah Penitip"}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddOrUpdatePenitip}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nama_penitip">
                    <i className="fas fa-user"></i> Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="nama_penitip"
                    placeholder="Masukkan nama lengkap"
                    value={newPenitip.nama_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, nama_penitip: e.target.value })}
                    required={editId === null}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email_penitip">
                    <i className="fas fa-envelope"></i> Email
                  </label>
                  <input
                    type="email"
                    id="email_penitip"
                    placeholder="Masukkan alamat email"
                    value={newPenitip.email_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, email_penitip: e.target.value })}
                    required={editId === null}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password_penitip">
                    <i className="fas fa-lock"></i> {editId !== null ? "Password (Kosongkan jika tidak diubah)" : "Password"}
                  </label>
                  <input
                    type="password"
                    id="password_penitip"
                    placeholder={editId !== null ? "Kosongkan jika tidak diubah" : "Masukkan password"}
                    value={newPenitip.password_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, password_penitip: e.target.value })}
                    required={editId === null}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="no_telepon_penitip">
                    <i className="fas fa-phone"></i> Nomor Telepon
                  </label>
                  <input
                    type="text"
                    id="no_telepon_penitip"
                    placeholder="Masukkan nomor telepon (contoh: +6281234567890)"
                    value={newPenitip.no_telepon_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, no_telepon_penitip: e.target.value })}
                    required={editId === null}
                    pattern="[0-9\+-]+"
                    title="Nomor telepon hanya boleh berisi angka, tanda +, atau tanda -"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tgl_lahir_penitip">
                    <i className="fas fa-calendar-alt"></i> Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    id="tgl_lahir_penitip"
                    value={newPenitip.tgl_lahir_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, tgl_lahir_penitip: e.target.value })}
                    required={editId === null}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nik_penitip">
                    <i className="fas fa-id-card"></i> NIK
                  </label>
                  <input
                    type="text"
                    id="nik_penitip"
                    placeholder="Masukkan Nomor Induk Kependudukan (16 digit)"
                    value={newPenitip.nik_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, nik_penitip: e.target.value })}
                    required={editId === null}
                    pattern="[0-9]{16}"
                    title="NIK harus terdiri dari 16 digit angka"
                  />
                </div>
              </div>
              <div className="form-group foto-ktp-container">
                <label htmlFor="foto_ktp_penitip">
                  <i className="fas fa-image"></i> Foto KTP
                </label>
                <div className="foto-ktp-input">
                  <input
                    type="file"
                    id="foto_ktp_penitip"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="file-input"
                    required={false}
                  />
                  <label htmlFor="foto_ktp_penitip" className="file-label">
                    <i className="fas fa-upload"></i>
                    <span>
                      {newPenitip.foto_ktp_penitip ? 
                        newPenitip.foto_ktp_penitip.name : 
                        editId !== null && previewImage ? 
                          "Foto KTP sudah ada" : 
                          "Pilih file foto KTP (opsional)"}
                    </span>
                  </label>
                </div>
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview KTP" />
                  </div>
                )}
                {editId !== null && (
                  <p className="file-note">
                    <i className="fas fa-info-circle"></i> Biarkan kosong jika tidak ingin mengubah foto KTP
                  </p>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  <i className="fas fa-times"></i> Batal
                </button>
                <button type="submit" className="submit-btn">
                  <i className="fas fa-save"></i> {editId !== null ? "Perbarui Data" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReplyModal && replyingDiscussion && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Balas Diskusi Produk</h3>
              <button className="close-btn" onClick={handleCloseReplyModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleReplySubmit}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1', border: '1px solid #eee', padding: '1rem', borderRadius: '8px' }}>
                  <h4>Diskusi:</h4>
                  <p><strong>Barang:</strong> {replyingDiscussion.barang?.nama_barang || 'N/A'}</p>
                  <p><strong>Pembeli:</strong> {replyingDiscussion.pembeli?.nama_pembeli || 'N/A'}</p>
                  <p><strong>Komentar:</strong> {replyingDiscussion.komentar_pembeli}</p>
                  {replyingDiscussion.barang?.image && (
                    <img
                      src={`http://127.0.0.1:8000/images/${replyingDiscussion.barang.image}`}
                      alt={replyingDiscussion.barang.nama_barang || 'Barang'}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', marginTop: '0.5rem' }}
                    />
                  )}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="komentar_pegawai">Balasan Anda:</label>
                  <textarea
                    id="komentar_pegawai"
                    placeholder="Tulis balasan Anda di sini..."
                    value={replyFormData.komentar_pegawai}
                    onChange={(e) => setReplyFormData({ ...replyFormData, komentar_pegawai: e.target.value })}
                    required
                    rows="4"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '0.95rem' }}
                  ></textarea>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseReplyModal}>Batal</button>
                <button type="submit" className="submit-btn">Kirim Balasan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSDashboard;