import React, { useState, useEffect } from "react";
import "./cs.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const CSDashboard = () => {
  const [penitip, setPenitip] = useState([]);
  const [csProfile, setCSProfile] = useState(null);
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
  });
  const [editIndex, setEditIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    // Hanya izinkan peran 'cs' atau 'manager' untuk mengakses dashboard ini
    if (!['cs', 'manager'].includes(userRole)) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const id_pegawai = localStorage.getItem("id_pegawai"); // Menggunakan id_pegawai untuk CS

      try {
        // Fetch CS profile data
        const profileResponse = await axios.get(`http://127.0.0.1:8000/api/pegawai/${id_pegawai}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCSProfile(profileResponse.data);

        // Fetch penitip data
        const penitipResponse = await axios.get("http://127.0.0.1:8000/api/penitip", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (Array.isArray(penitipResponse.data)) {
          setPenitip(penitipResponse.data);
        } else if (penitipResponse.data && Array.isArray(penitipResponse.data.data)) {
          // Handle jika data penitip berada dalam property 'data'
          setPenitip(penitipResponse.data.data);
        } else {
          console.error("Unexpected data format:", penitipResponse.data);
          setError("Format data penitip tidak valid");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Gagal memuat data. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPenitip({
        ...newPenitip,
        foto_ktp_penitip: file
      });
      
      // Create preview URL
      const previewURL = URL.createObjectURL(file);
      setPreviewImage(previewURL);
    }
  };

  const handleAddOrUpdatePenitip = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const url = editIndex !== null 
      ? `http://127.0.0.1:8000/api/penitip/${penitip[editIndex].id_penitip}` 
      : "http://127.0.0.1:8000/api/penitip";
    const method = editIndex !== null ? "put" : "post";
  
    try {
      // Buat FormData untuk menangani upload file
      const formData = new FormData();
      
      // Tambahkan semua field ke FormData
      formData.append("nama_penitip", newPenitip.nama_penitip);
      formData.append("email_penitip", newPenitip.email_penitip);
      
      // Hanya tambahkan password jika tidak kosong
      if (newPenitip.password_penitip) {
        formData.append("password_penitip", newPenitip.password_penitip);
      }
      
      formData.append("tgl_lahir_penitip", newPenitip.tgl_lahir_penitip);
      formData.append("no_telepon_penitip", newPenitip.no_telepon_penitip);
      formData.append("nik_penitip", newPenitip.nik_penitip);
      
      // Tambahkan file KTP jika ada
      if (newPenitip.foto_ktp_penitip) {
        formData.append("foto_ktp_penitip", newPenitip.foto_ktp_penitip);
      }
  
      // Kirim request dengan FormData
      const response = await axios({
        method: method,
        url: url,
        data: formData,
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
      });
  
      // Update state penitip
      if (editIndex !== null) {
        // Update penitip yang sudah ada
        setPenitip(penitip.map((item, index) => 
          index === editIndex ? response.data : item
        ));
      } else {
        // Tambah penitip baru
        setPenitip([...penitip, response.data]);
      }
  
      // Reset form dan tutup modal
      handleCloseModal();
    } catch (err) {
      console.error("Error Adding/Updating Penitip:", err);
      alert("Gagal menambahkan/memperbarui data penitip. Silakan coba lagi.");
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
    } catch (err) {
      console.error("Error Deleting Penitip:", err);
      alert("Gagal menghapus penitip. Silakan coba lagi.");
    }
  };

  const handleEditPenitip = (index) => {
    const penitipToEdit = penitip[index];
    setEditIndex(index);
    
    // Format tanggal lahir untuk input date
    let formattedDate = "";
    if (penitipToEdit.tgl_lahir_penitip) {
      // Pastikan format tanggal sesuai dengan input type="date" (YYYY-MM-DD)
      formattedDate = new Date(penitipToEdit.tgl_lahir_penitip)
        .toISOString()
        .split("T")[0];
    }
    
    setNewPenitip({
      nama_penitip: penitipToEdit.nama_penitip || "",
      email_penitip: penitipToEdit.email_penitip || "",
      password_penitip: "", // Kosongkan password untuk keamanan
      tgl_lahir_penitip: formattedDate,
      no_telepon_penitip: penitipToEdit.no_telepon_penitip || "",
      nik_penitip: penitipToEdit.nik_penitip || "",
      foto_ktp_penitip: null, // File tidak bisa diisi ulang
    });
    
    setPreviewImage(penitipToEdit.foto_ktp_penitip ? 
      `http://127.0.0.1:8000/storage/${penitipToEdit.foto_ktp_penitip.replace('public/', '')}` : 
      null);
      
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    localStorage.removeItem("id_pegawai");
    localStorage.removeItem("name");
    localStorage.removeItem("jabatan");
    navigate("/");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditIndex(null); // Reset ke mode "tambah"
    setPreviewImage(null);
    setNewPenitip({
      nama_penitip: "",
      email_penitip: "",
      password_penitip: "",
      tgl_lahir_penitip: "",
      no_telepon_penitip: "",
      nik_penitip: "",
      foto_ktp_penitip: null,
    });
  };

  // Handle search function
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter penitip based on search term
  const filteredPenitip = penitip.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.nama_penitip && item.nama_penitip.toLowerCase().includes(searchLower)) ||
      (item.email_penitip && item.email_penitip.toLowerCase().includes(searchLower)) ||
      (item.no_telepon_penitip && item.no_telepon_penitip.toLowerCase().includes(searchLower)) ||
      (item.nik_penitip && item.nik_penitip.toLowerCase().includes(searchLower))
    );
  });

  // Highlight search term in text
  const highlightMatch = (text, term) => {
    if (!term || !text) return text;
    
    const parts = text.toString().split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === term.toLowerCase() ? 
        <span key={index} className="search-highlight">{part}</span> : part
    );
  };

  return (
    <div className="cs-dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>ReUseMart</span>
        </div>
        <ul className="nav-links">
          <li>
            <button onClick={handleLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i>Keluar</button>
          </li>
        </ul>
      </nav>

       {/* Dashboard Content */}
       <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Dashboard Customer Service</h2>
          <p className="welcome-text">Selamat datang, {csProfile?.nama_pegawai || "Customer Service"}</p>
        </div>

        <div className="dashboard-grid">
          {/* Profil CS Panel */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3>Profil Customer Service</h3>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Memuat profil...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                <p>{error}</p>
              </div>
            ) : csProfile ? (
              <div className="profile-card">
                <div className="profile-info">
                  <div className="info-item">
                    <span className="info-label">ID Pegawai</span>
                    <span className="info-value">{csProfile.id_pegawai}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Nama</span>
                    <span className="info-value">{csProfile.nama_pegawai}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{csProfile.email_pegawai}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Jabatan</span>
                    <span className="info-value">{csProfile.jabatan?.nama_jabatan || 'Tidak Ada'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-data">Data profil tidak tersedia</p>
            )}
          </div>

          {/* Manajemen Penitip Panel */}
          <div className="dashboard-panel penitip-panel">
            <div className="panel-header">
              <h3>Manajemen Penitip</h3>
              <button className="add-btn" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus"></i> Tambah Penitip
              </button>
            </div>
            
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
            ) : penitip.length > 0 ? (
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
                    {penitip.map((item, index) => (
                      <tr key={item.id_penitip}>
                        <td>{item.nama_penitip}</td>
                        <td>{item.email_penitip}</td>
                        <td>{item.no_telepon_penitip}</td>
                        <td>{item.nik_penitip}</td>
                        <td>
                          {item.tgl_lahir_penitip
                            ? new Date(item.tgl_lahir_penitip).toLocaleDateString('id-ID')
                            : '-'}
                        </td>
                        <td className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEditPenitip(index)}>
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

      {/* Modal Tambah / Edit Penitip */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editIndex !== null ? "Edit Data Penitip" : "Tambah Penitip"}</h3>
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
                    required
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
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password_penitip">
                    <i className="fas fa-lock"></i> {editIndex !== null ? "Password (Kosongkan jika tidak diubah)" : "Password"}
                  </label>
                  <input
                    type="password"
                    id="password_penitip"
                    placeholder={editIndex !== null ? "Kosongkan jika tidak diubah" : "Masukkan password"}
                    value={newPenitip.password_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, password_penitip: e.target.value })}
                    required={editIndex === null} // Hanya required jika menambah baru
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="no_telepon_penitip">
                    <i className="fas fa-phone"></i> Nomor Telepon
                  </label>
                  <input
                    type="text"
                    id="no_telepon_penitip"
                    placeholder="Masukkan nomor telepon"
                    value={newPenitip.no_telepon_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, no_telepon_penitip: e.target.value })}
                    required
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
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="nik_penitip">
                    <i className="fas fa-id-card"></i> NIK
                  </label>
                  <input
                    type="text"
                    id="nik_penitip"
                    placeholder="Masukkan Nomor Induk Kependudukan"
                    value={newPenitip.nik_penitip}
                    onChange={(e) => setNewPenitip({ ...newPenitip, nik_penitip: e.target.value })}
                    required
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
                    required={editIndex === null} // Hanya required jika menambah baru
                  />
                  <label htmlFor="foto_ktp_penitip" className="file-label">
                    <i className="fas fa-upload"></i>
                    <span>
                      {newPenitip.foto_ktp_penitip ? 
                        newPenitip.foto_ktp_penitip.name : 
                        editIndex !== null && previewImage ? 
                          "Foto KTP sudah ada" : 
                          "Pilih file foto KTP"}
                    </span>
                  </label>
                </div>
                
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview KTP" />
                  </div>
                )}
                
                {editIndex !== null && (
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
                  <i className="fas fa-save"></i> {editIndex !== null ? "Perbarui Data" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSDashboard;