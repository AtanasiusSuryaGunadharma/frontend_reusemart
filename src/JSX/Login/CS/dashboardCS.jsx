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
  // State BARU untuk modal balasan CS
    const [showReplyModal, setShowReplyModal] = useState(false); // Modal balasan CS
    const [replyFormData, setReplyFormData] = useState({ // State form balasan
        komentar_pegawai: '',
        discussion_id: null, // ID diskusi yang dibalas
    });
  const [replyingDiscussion, setReplyingDiscussion] = useState(null); // Diskusi yang sedang dibalas (object atau null)

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

    const handleLogout = () => {
        // ... (kode logout sama) ...
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

    // Fungsi untuk fetch SEMUA diskusi produk (untuk CS)
    const fetchAllDiscussions = async (token, search = '') => { // Opsional: tambah parameter search jika backend mendukung
        try {
            // Panggil endpoint index DiskusiProduk (yang mengembalikan SEMUA diskusi dengan relasi)
            const response = await axios.get(`http://127.0.0.1:8000/api/diskusi-produk`, { // <-- Endpoint index
                headers: { Authorization: `Bearer ${token}` },
                params: { search: search } // Kirim parameter search jika ada
            });
            console.log("Fetched All Discussions (CS):", response.data); // <-- LOG DEBUGGING
            // Pastikan response.data adalah array diskusi
             if (Array.isArray(response.data)) {
                setAllDiscussions(response.data); // Simpan data diskusi
            } else if (response.data && Array.isArray(response.data.data)) {
                // Handle jika data ada di property 'data'
                setAllDiscussions(response.data.data);
            } else {
                 console.error("Unexpected discussion data format:", response.data);
                 setAllDiscussions([]); // Kosongkan daftar jika format tidak sesuai
            }

        } catch (err) {
            console.error("Error fetching all discussions:", err.response?.data || err.message); // <-- LOG DEBUGGING
            // setError("Gagal memuat daftar diskusi."); // Opsional: error spesifik
             toast.error("Gagal memuat daftar diskusi."); // Tampilkan toast
            if (err.response?.status === 401) handleLogout();
        }
    };

     // Fungsi fetch data penitip (jika ada manajemen penitip di CS)
    // const fetchPenitip = async (token, search = '') => { ... };

    // Handler BARU untuk membuka modal balasan
    const handleReplyClick = (discussion) => {
        setReplyingDiscussion(discussion); // Simpan diskusi yang akan dibalas
        setReplyFormData({ // Reset form balasan
            komentar_pegawai: discussion.komentar_pegawai || '', // Isi jika sudah ada balasan sebelumnya
            discussion_id: discussion.id_diskusi, // Simpan ID diskusi
        });
        setShowReplyModal(true); // Buka modal balasan
    };

    // Handler BARU submit form balasan
    const handleReplySubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        if (!replyingDiscussion || !replyFormData.discussion_id) {
            toast.error("Data diskusi tidak valid.");
            return;
        }
        if (!replyFormData.komentar_pegawai.trim()) { // Validasi balasan tidak kosong
             toast.error("Balasan tidak boleh kosong.");
             return;
        }


        const payload = {
            komentar_pegawai: replyFormData.komentar_pegawai,
            // Backend akan mengisi pegawai_id_diskusi dari Auth::user()
        };

        try {
            const response = await axios.put(`http://127.0.0.1:8000/api/diskusi-produk/${replyFormData.discussion_id}`, payload, { // <-- Endpoint update diskusi produk
                 headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Reply submitted successfully:", response.data);
            toast.success(response.data.message || "Balasan berhasil dikirim.");

            // Fetch ulang SEMUA diskusi setelah submit balasan agar daftar terupdate
            const currentToken = localStorage.getItem('authToken');
            if(currentToken) {
                await fetchAllDiscussions(currentToken); // <-- Fetch ulang semua diskusi
            }

            handleCloseReplyModal(); // Tutup modal balasan

        } catch (err) {
             console.error("Error submitting reply:", err.response?.data || err.message);
             const backendErrorMessage = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Gagal mengirim balasan.');
             toast.error(backendErrorMessage);
        }
    };

    // Handler BARU menutup modal balasan
    const handleCloseReplyModal = () => {
        setShowReplyModal(false);
        setReplyingDiscussion(null);
        setReplyFormData({ komentar_pegawai: '', discussion_id: null });
    };

     // Handler search penitip (jika ada manajemen penitip di CS dashboard)
    const handleSearchPenitipChange = (e) => {
        // ... (kode handler search penitip yang sudah ada jika diperlukan) ...
         setSearchTerm(e.target.value);
         const token = localStorage.getItem("authToken");
         if (token) {
             // fetchPenitip(token, e.target.value); // Jika manajemen penitip ada
         }
    };

  // useEffect untuk memuat data saat komponen mount
useEffect(() => {
    const token = localStorage.getItem("authToken");
    const id_pegawai = localStorage.getItem("id_pegawai"); // Menggunakan id_pegawai untuk CS
    const userRole = localStorage.getItem("userRole");

    // Cek role untuk pengamanan rute
    if (!token || !userRole || !['cs', 'manager', 'admin'].includes(userRole)) { // Izinkan CS, Manager, Admin lihat dashboard CS
        navigate("/generalLogin");
        toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
        return;
    }

    const fetchData = async () => {
        setLoading(true);
        setError(null); // Reset error

        try {
            // Fetch CS profile data
            const profileResponse = await axios.get(`http://127.0.0.1:8000/api/pegawai/${id_pegawai}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCSProfile(profileResponse.data);

            // Fetch SEMUA diskusi produk
            await fetchAllDiscussions(token);

            // Fetch data penitip jika ada manajemen penitip di CS dashboard
            // await fetchPenitip(token);

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

 if (loading) return <div className="loading-container">Memuat Dashboard...</div>;
 if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="cs-dashboard">
            {/* Navbar */}
            <nav className="navbar">
                <div className="logo">
                    <span>ReUseMart CS</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/cs/dashboard">Dashboard</Link></li>
                    <li><button onClick={handleLogout}>Logout</button></li>
                </ul>
            </nav>

            {/* Dashboard Content */}
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h2>Dashboard Customer Service</h2>
                    <p className="welcome-text">
                        Selamat datang, {csProfile?.nama_pegawai || "Customer Service"}
                    </p>
                </div>

                {/* Contoh: Dashboard CS bisa memiliki grid 2 kolom */}
                <div className="dashboard-grid">
                    {/* Panel Kiri (Diskusi Produk) */}
                    <div className="dashboard-panel" style={{ flex: 1 }}>
                        <div className="panel-header">
                            <h3>Daftar Diskusi Produk</h3>
                            {/* Input Search Diskusi */}
                            {/* <div className="search-container">
                                <input type="text" placeholder="Cari Diskusi..." value={searchTermDiscussionCS} onChange={handleSearchDiscussionChangeCS} className="search-input" />
                                <i className="fas fa-search search-icon"></i>
                            </div> */}
                        </div>

                        {/* Daftar Diskusi Produk untuk CS */}
                        <div className="discussion-list employee-list" style={{ padding: '1.5rem' }}>
                            {allDiscussions.length > 0 ? (
                                allDiscussions.map(discussion => (
                                    <div key={discussion.id_diskusi} className="discussion-card employee-card">
                                        <div className="discussion-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            {discussion.barang?.image && (
                                                <img
                                                    src={`http://127.0.0.1:8000/images/${discussion.barang.image}`}
                                                    alt={discussion.barang.nama_barang || 'Barang'}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '1rem' }}
                                                />
                                            )}
                                            <div>
                                                <strong>Barang:</strong> {discussion.barang?.nama_barang || 'N/A'}
                                                <br />
                                                <strong>Pembeli:</strong> {discussion.pembeli?.nama_pembeli || 'N/A'} ({discussion.pembeli?.email_pembeli || 'N/A'})
                                            </div>
                                        </div>

                                        <div className="pembeli-comment" style={{ marginBottom: '0.5rem', borderLeft: '4px solid #0056a3', paddingLeft: '10px' }}>
                                            <strong>Komentar Pembeli:</strong> {discussion.komentar_pembeli}
                                        </div>

                                        {discussion.komentar_pegawai ? (
                                            <div className="cs-reply" style={{ borderLeft: '4px solid #10b981', paddingLeft: '10px' }}>
                                                <strong>Balasan CS ({discussion.pegawai?.nama_pegawai || 'N/A'}):</strong> {discussion.komentar_pegawai}
                                            </div>
                                        ) : (
                                            <div className="cs-reply-pending" style={{ fontStyle: 'italic', color: '#666' }}>
                                                <em>Belum ada balasan dari CS.</em>
                                            </div>
                                        )}

                                        <div className="discussion-actions" style={{ marginTop: '1rem', textAlign: 'right' }}>
                                            <button
                                                className="reply-btn"
                                                onClick={() => handleReplyClick(discussion)}
                                                style={{ padding: '0.5rem 1rem', backgroundColor: '#0056a3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                            >
                                                Balas
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Tidak ada diskusi produk saat ini.</p>
                            )}
                        </div>
                    </div>

                    {/* Panel Kanan */}
                    <div className="dashboard-panel" style={{ flex: 1 }}>
                        <div className="panel-header">
                            <h3>Manajemen Penitip (Contoh Panel Lain)</h3>
                        </div>
                        <div className="penitip-table-container">
                            <p style={{ padding: '1.5rem' }}>Konten manajemen Penitip di sini...</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Balasan CS */}
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