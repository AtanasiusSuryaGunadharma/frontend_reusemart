// src\JSX\Login\Pembeli\dashboardPembeli.jsx (Modified)
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./dashboardPembeli.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const PembeliDashboard = () => {
    // State untuk profil Pembeli
    const [pembeliProfile, setPembeliProfile] = useState(null);
    // State untuk daftar alamat Pembeli
    const [addresses, setAddresses] = useState([]);
    // State BARU untuk input pencarian alamat
    const [searchTermAddress, setSearchTermAddress] = useState('');

    // State BARU untuk diskusi produk Pembeli
    const [myDiscussions, setMyDiscussions] = useState([]); // <-- State baru untuk diskusi pembeli
    const [showAddDiscussionModal, setShowAddDiscussionModal] = useState(false); // Modal tambah diskusi
    const [discussionFormData, setDiscussionFormData] = useState({ // State form diskusi
        komentar_pembeli: '',
        barang_id_diskusi: null, // ID barang yang dipilih
    });
    // State untuk memilih barang di modal diskusi
    const [productSearchTerm, setProductSearchTerm] = useState(''); // Input search barang di modal
    const [availableProducts, setAvailableProducts] = useState([]); // Daftar barang hasil search di modal
    const [selectedProduct, setSelectedProduct] = useState(null); // Barang yang dipilih di modal

    // State untuk modal Alamat (Tambah/Edit)
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressFormData, setAddressFormData] = useState({
        alamat_lengkap: "",
    });
    // State loading dan error (bisa dipisah per section kalau mau lebih detail)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // Handler Logout (sama seperti sebelumnya)
    const handleLogout = () => {
        // ... (kode logout sama) ...
        localStorage.removeItem("userRole");
        localStorage.removeItem("authToken");
        localStorage.removeItem("id_pembeli");
        localStorage.removeItem("username_pembeli");
        localStorage.removeItem("email_pembeli");
        localStorage.removeItem("password_pembeli");
        localStorage.removeItem("no_telepon_pembeli");
        localStorage.removeItem("poin_loyalitas");
        localStorage.removeItem("tgl_lahir_pembeli");
        localStorage.removeItem("id_pegawai");
        localStorage.removeItem("name");
        localStorage.removeItem("jabatan");
        localStorage.removeItem("id_organisasi");
        localStorage.removeItem("nama_organisasi");
        localStorage.removeItem("email_organisasi");
        localStorage.removeItem("id_penitip");
        localStorage.removeItem("email_penitip");
        localStorage.removeItem("no_telepon_penitip");

        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    // Fetch profil Pembeli (sama seperti sebelumnya)
    const fetchPembeliProfile = async (token, pembeliId) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/pembeli/${pembeliId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPembeliProfile(response.data);
        } catch (err) {
            console.error("Error fetching pembeli profile:", err);
            if (err.response?.status === 401) handleLogout();
        }
    };

    // Fetch daftar alamat (sama seperti sebelumnya)
    const fetchPembeliAddresses = async (token, search = '') => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/alamat`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search: search }
            });
            console.log("Fetched addresses:", response.data);
            setAddresses(response.data);
        } catch (err) {
            console.error("Error fetching addresses:", err.response?.data || err.message);
            setError("Gagal memuat daftar alamat.");
            if (err.response?.status === 401) handleLogout();
        }
    };

    // Fungsi BARU untuk fetch diskusi produk milik Pembeli
    const fetchMyDiscussions = async (token) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/diskusi-produk/my-discussions`, { headers: { Authorization: `Bearer ${token}` } });
            console.log("Fetched My Discussions:", response.data);
            // Pastikan response.data adalah array
            if (Array.isArray(response.data)) {
                 setMyDiscussions(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                 setMyDiscussions(response.data.data); // Handle jika data di property 'data'
            } else {
                 console.error("Unexpected discussion data format:", response.data);
                 setMyDiscussions([]); // Kosongkan daftar jika format tidak sesuai
            }

        } catch (err) { console.error("Error fetching my discussions:", err.response?.data || err.message); if (err.response?.status === 401) handleLogout(); }
    };

    // Fungsi BARU untuk fetch daftar barang (dengan search) untuk dipilih di modal diskusi
    const fetchProductsForDiscussion = async (token, search = '') => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/barang`, { headers: { Authorization: `Bearer ${token}` }, params: { search: search } });
            console.log("Fetched products for discussion:", response.data);
            if (Array.isArray(response.data)) { setAvailableProducts(response.data); }
             else if (response.data && Array.isArray(response.data.data)) { setAvailableProducts(response.data.data); }
            else { console.error("Unexpected product data format:", response.data); setAvailableProducts([]); }
        } catch (err) { console.error("Error fetching products for discussion:", err.response?.data || err.message); if (err.response?.status === 401) handleLogout(); }
    };

    // Load data saat komponen mount
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const pembeliId = localStorage.getItem("id_pembeli");
        const userRole = localStorage.getItem("userRole");

        if (!token || !pembeliId || userRole !== "pembeli") {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null); // Reset error

            await fetchPembeliProfile(token, pembeliId);
            await fetchPembeliAddresses(token); // Fetch alamat

            await fetchMyDiscussions(token); // <-- Fetch diskusi milik Pembeli

            setLoading(false); // Selesai loading
        };

        fetchData();

    }, [navigate]); // Dependency array

    // Handler untuk input pencarian alamat (sama seperti sebelumnya)
    const handleSearchAddressChange = (e) => {
        const searchTerm = e.target.value;
        setSearchTermAddress(searchTerm);
        const token = localStorage.getItem("authToken");
        if (token) { fetchPembeliAddresses(token, searchTerm); }
    };

    // Handler BARU untuk input pencarian barang di modal diskusi (Debounce opsional)
    const handleProductSearchChange = async (e) => {
         const searchTerm = e.target.value;
         setProductSearchTerm(searchTerm); // Update state input search barang

         // Panggil fetch products saat mengetik (dengan debounce opsional jika API lambat)
         const token = localStorage.getItem('authToken');
         if (token && searchTerm.length > 2) { // Trigger search setelah minimal 3 karakter (opsional)
             await fetchProductsForDiscussion(token, searchTerm);
         } else if (searchTerm.length === 0) {
             setAvailableProducts([]); // Kosongkan daftar jika input search kosong
         }
    };

    // Handler BARU saat barang dipilih dari daftar di modal
    const handleProductSelect = (product) => {
        setSelectedProduct(product); // Simpan objek barang yang dipilih
        setDiscussionFormData({ // Set barang_id_diskusi di form data diskusi
             ...discussionFormData,
             barang_id_diskusi: product.id_barang,
        });
        setProductSearchTerm(product.nama_barang); // Isi input search dengan nama barang
        setAvailableProducts([]); // Sembunyikan daftar saran setelah memilih
    };

    // Handler untuk membuka modal tambah diskusi
    const handleAddDiscussionClick = async () => {
        setDiscussionFormData({ komentar_pembeli: '', barang_id_diskusi: null });
        setSelectedProduct(null);
        setProductSearchTerm('');
        setAvailableProducts([]); // Kosongkan daftar barang
        setShowAddDiscussionModal(true); // Buka modal

        // Opsional: Fetch daftar barang saat modal dibuka (jika ingin semua barang tampil di awal)
        // const token = localStorage.getItem('authToken');
        // if (token) { await fetchProductsForDiscussion(token); }
    };

    // Handler submit form tambah diskusi
    const handleDiscussionSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");

        if (!selectedProduct || !selectedProduct.id_barang) {
            toast.error("Mohon pilih barang terlebih dahulu.");
            return;
        }
        if (!discussionFormData.komentar_pembeli.trim()) { // Validasi komentar tidak kosong
             toast.error("Komentar/Pertanyaan tidak boleh kosong.");
             return;
        }


        const payload = {
            komentar_pembeli: discussionFormData.komentar_pembeli,
            barang_id_diskusi: selectedProduct.id_barang,
            // Backend akan mengisi pembeli_id_diskusi, komentar_pegawai, pegawai_id_diskusi
        };

        try {
            const response = await axios.post(`http://127.0.0.1:8000/api/diskusi-produk`, payload, { headers: { Authorization: `Bearer ${token}` } });
            console.log("Discussion created successfully:", response.data);
            toast.success(response.data.message || "Diskusi berhasil diajukan.");

            // Fetch ulang diskusi milik Pembeli
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) { await fetchMyDiscussions(currentToken); }

            handleCloseAddDiscussionModal(); // Tutup modal

        } catch (err) {
            console.error("Error submitting discussion:", err.response?.data || err.message);
            const backendErrorMessage = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Gagal mengajukan diskusi.');
            toast.error(backendErrorMessage);
        }
    };

    // Handler menutup modal tambah diskusi
    const handleCloseAddDiscussionModal = () => {
        setShowAddDiscussionModal(false);
        setDiscussionFormData({ komentar_pembeli: '', barang_id_diskusi: null });
        setSelectedProduct(null);
        setProductSearchTerm('');
        setAvailableProducts([]); // Kosongkan daftar saran saat menutup
    };

    // --- Handler Alamat (kode sama seperti sebelumnya) ---
    // Modal tambah alamat
    const handleAddAddressClick = () => {
        setEditingAddress(null);
        setAddressFormData({ alamat_lengkap: "" });
        setShowAddressModal(true);
    };

    // Modal edit alamat
    const handleEditAddressClick = (address) => {
        setEditingAddress(address);
        setAddressFormData({ alamat_lengkap: address.alamat_lengkap });
        setShowAddressModal(true);
    };

    // Submit form alamat
    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        const url = editingAddress ? `/api/alamat/${editingAddress.id_alamat}` : "/api/alamat";
        const method = editingAddress ? "put" : "post";

        try {
            const response = await axios[method](`http://127.0.0.1:8000${url}`, addressFormData, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(response.data.message || (editingAddress ? "Alamat berhasil diperbarui" : "Alamat berhasil ditambahkan"));
            const currentToken = localStorage.getItem('authToken');
            if(currentToken) { await fetchPembeliAddresses(currentToken, searchTermAddress); }
            handleCloseAddressModal();
        } catch (err) {
            console.error("Error saving address:", err.response?.data || err.message);
            const backendErrorMessage = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Gagal menyimpan alamat.');
            toast.error(backendErrorMessage);
        }
    };

    // Hapus alamat
    const handleDeleteAddress = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
        const token = localStorage.getItem("authToken");
        try {
            await axios.delete(`http://127.0.0.1:8000/api/alamat/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Alamat berhasil dihapus.");
            const currentToken = localStorage.getItem('authToken');
            if(currentToken) { await fetchPembeliAddresses(currentToken, searchTermAddress); }
        } catch (err) {
            console.error("Error deleting address:", err);
            toast.error(err.response?.data?.message || "Gagal menghapus alamat.");
        }
    };

    // Menutup modal alamat
    const handleCloseAddressModal = () => {
        setShowAddressModal(false);
        setEditingAddress(null);
        setAddressFormData({ alamat_lengkap: "" });
    };
    // --- Akhir Handler Alamat ---

    if (loading) return <div className="loading-state">Memuat Dashboard...</div>;
    if (error) return <div className="error-state">Error: {error}</div>;

    return (
    <div className="pembeli-dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART PEMBELI</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/pembeli/dashboard">Dashboard</Link></li>
          <li><Link to="/shop">Shop</Link></li>
          <li><button onClick={handleLogout}>Logout</button></li>
        </ul>
      </nav>

      {/* Konten Dashboard */}
      <div className="dashboard-container">
        <h2>Dashboard Pembeli</h2>

        {/* Bagian Profil Pembeli */}
        <div className="dashboard-section">
          <h3>Profil Anda</h3>
          {!loading && !error && pembeliProfile ? (
            <div className="profile-details">
              <p><strong>ID:</strong> {pembeliProfile.id_pembeli}</p>
              <p><strong>Nama:</strong> {pembeliProfile.nama_pembeli}</p>
              <p><strong>Username:</strong> {pembeliProfile.username_pembeli}</p>
              <p><strong>Email:</strong> {pembeliProfile.email_pembeli}</p>
              <p><strong>Nomor Telepon:</strong> {pembeliProfile.no_telepon_pembeli}</p>
              <p><strong>Tanggal Lahir:</strong> {pembeliProfile.tgl_lahir_pembeli}</p>
              <p><strong>Poin Reward:</strong> {pembeliProfile.poin_loyalitas}</p>
            </div>
          ) : (
            !loading && !error && <p>Profil tidak dapat dimuat.</p>
          )}
        </div>

        {/* Bagian Manajemen Alamat */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Alamat Anda</h3>
            <button className="add-address-btn" onClick={handleAddAddressClick}>
              Tambah Alamat
            </button>
          </div>
          <p>Daftar alamat:</p>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Cari Alamat..." 
              value={searchTermAddress} 
              onChange={handleSearchAddressChange} 
              style={{ padding: '0.5rem', width: '100%', borderRadius: '5px', border: '1px solid #ddd' }} 
            />
          </div>
          <div className="address-list employee-list" style={{ marginTop: '1rem' }}>
            {!loading && !error && (
              addresses.length > 0 ? (
                addresses.map(address => (
                  <div key={address.id_alamat} className="address-card employee-card">
                    <span>{address.alamat_lengkap}</span>
                    <div>
                      <button onClick={() => handleEditAddressClick(address)}>Edit</button>
                      <button onClick={() => handleDeleteAddress(address.id_alamat)}>Hapus</button>
                    </div>
                  </div>
                ))
              ) : (
                searchTermAddress !== '' ? (
                  <p>Tidak ditemukan alamat yang cocok dengan "{searchTermAddress}".</p>
                ) : (
                  <p>Anda belum memiliki alamat tersimpan.</p>
                )
              )
            )}
          </div>
        </div>

        {/* Bagian Diskusi Produk */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Diskusi Produk Anda</h3>
            <button className="add-address-btn" onClick={handleAddDiscussionClick}>
              Tambah Diskusi
            </button>
          </div>
          <p>Daftar diskusi Anda:</p>

          {/* Input Search Diskusi (Opsional di sini) */}
          {/* <div className="search-bar"> ... </div> */}

          {/* Rendering Daftar Diskusi Pembeli */}
          <div className="discussion-list employee-list" style={{ marginTop: '1rem' }}>
            {!loading && !error && (
              myDiscussions.length > 0 ? (
                myDiscussions.map(discussion => (
                  <div key={discussion.id_diskusi} className="discussion-card employee-card">
                    <div className="discussion-item-header" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '0.5rem' 
                    }}>
                      {discussion.barang?.image && (
                        <img 
                          src={`http://127.0.0.1:8000/images/${discussion.barang.image}`} 
                          alt={discussion.barang.nama_barang || 'Barang'} 
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover', 
                            borderRadius: '4px', 
                            marginRight: '1rem' 
                          }} 
                        />
                      )}
                      <div>
                        <strong>Barang:</strong> {discussion.barang?.nama_barang || 'N/A'}
                      </div>
                    </div>

                    <div className="pembeli-comment" style={{ marginBottom: '0.5rem' }}>
                      <strong>Anda:</strong> {discussion.komentar_pembeli}
                    </div>

                    {discussion.komentar_pegawai ? (
                      <div className="cs-reply">
                        <strong>CS ({discussion.pegawai?.nama_pegawai || 'N/A'}):</strong> {discussion.komentar_pegawai}
                      </div>
                    ) : (
                      <div className="cs-reply-pending" style={{ fontStyle: 'italic', color: '#666' }}>
                        <em>Menunggu balasan dari CS...</em>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>Anda belum mengajukan diskusi produk.</p>
              )
            )}
          </div>
        </div>
      </div> {/* Tutup dashboard-container */}

      {/* Modal Tambah / Edit Alamat (sama seperti sebelumnya) */}
      {showAddressModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingAddress ? "Edit Alamat" : "Tambah Alamat Baru"}</h3>
            <form onSubmit={handleAddressSubmit}>
              <input 
                type="text" 
                placeholder="Alamat Lengkap" 
                name="alamat_lengkap" 
                value={addressFormData.alamat_lengkap} 
                onChange={(e) => setAddressFormData({ ...addressFormData, alamat_lengkap: e.target.value })} 
                required 
              />
              <div className="modal-actions">
                <button type="submit">{editingAddress ? "Perbarui Alamat" : "Simpan Alamat"}</button>
                <button type="button" onClick={handleCloseAddressModal}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Diskusi */}
      {showAddDiscussionModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tambah Diskusi Produk Baru</h3>
              <button className="close-btn" onClick={handleCloseAddDiscussionModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleDiscussionSubmit}>
              <div className="form-grid">
                {/* Bagian Pilih Barang */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="productSearch">Pilih Barang:</label>
                  <input
                    type="text"
                    id="productSearch"
                    placeholder="Cari nama barang..."
                    value={productSearchTerm}
                    onChange={handleProductSearchChange}
                  />

                  {/* Tampilkan daftar saran barang jika ada hasil dan input tidak kosong */}
                  {availableProducts.length > 0 && productSearchTerm && (
                    <ul className="product-suggestions-list" style={{
                      border: '1px solid #ddd',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      listStyle: 'none',
                      padding: 0,
                      margin: '0.5rem 0 0',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      width: 'calc(100% - 2rem)',
                      zIndex: 10
                    }}>
                      {availableProducts.map(product => (
                        <li 
                          key={product.id_barang} 
                          onClick={() => handleProductSelect(product)} 
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer'
                          }}
                        >
                          {/* Tampilkan nama barang di saran */}
                          {product.nama_barang || 'No Name'}
                          {/* Opsional: tampilkan foto kecil di saran */}
                          {/* {product.image && <img src={`http://127.0.0.1:8000/images/${product.image}`} alt="Product" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', marginRight: '0.5rem' }} />} */}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Tampilkan Barang yang Dipilih */}
                {selectedProduct && (
                  <div className="form-group" style={{
                    gridColumn: '1 / -1',
                    border: '1px solid #eee',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    {/* Foto Barang */}
                    {selectedProduct.image && (
                      <img
                        src={`http://127.0.0.1:8000/images/${selectedProduct.image}`}
                        alt={selectedProduct.nama_barang || 'Barang'}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    )}
                    {/* Nama Barang */}
                    <div>
                      <strong>Barang Terpilih:</strong> {selectedProduct.nama_barang || 'N/A'}
                    </div>
                  </div>
                )}

                {/* Bagian Komentar Pembeli */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="komentar_pembeli">Komentar/Pertanyaan:</label>
                  <textarea
                    id="komentar_pembeli"
                    placeholder="Tulis pertanyaan atau komentar Anda tentang barang ini..."
                    value={discussionFormData.komentar_pembeli}
                    onChange={(e) => setDiscussionFormData({
                      ...discussionFormData,
                      komentar_pembeli: e.target.value
                    })}
                    required
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '0.95rem'
                    }}
                  ></textarea>
                </div>
              </div>

              {/* Modal Actions (Submit/Cancel) */}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={handleCloseAddDiscussionModal}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={!selectedProduct || loading}
                >
                  {loading ? 'Mengirim...' : 'Kirim Diskusi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div> /* Tutup pembeli-dashboard-page */
  );
};

export default PembeliDashboard;