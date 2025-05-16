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
    // State untuk input pencarian alamat
    const [searchTermAddress, setSearchTermAddress] = useState('');

    // State untuk diskusi produk Pembeli
    const [myDiscussions, setMyDiscussions] = useState([]);
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
    // State loading dan error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // Handler Logout
    const handleLogout = () => {
        localStorage.removeItem("userRole");
        localStorage.removeItem("authToken");
        localStorage.removeItem("id_pembeli");
        localStorage.removeItem("nama_pembeli"); // Pastikan nama_pembeli juga dihapus
        localStorage.removeItem("username_pembeli");
        localStorage.removeItem("email_pembeli");
        localStorage.removeItem("password_pembeli");
        localStorage.removeItem("no_telepon_pembeli");
        localStorage.removeItem("poin_loyalitas");
        localStorage.removeItem("tgl_lahir_pembeli");

        // Hapus juga data role lain jika ada (penting untuk keamanan)
        localStorage.removeItem("id_pegawai");
        localStorage.removeItem("name"); // Ini mungkin nama pegawai/admin
        localStorage.removeItem("jabatan");
        localStorage.removeItem("id_organisasi");
        localStorage.removeItem("nama_organisasi");
        localStorage.removeItem("email_organisasi");
        localStorage.removeItem("id_penitip");
        localStorage.removeItem("email_penitip");
        localStorage.removeItem("no_telepon_penitip");
        localStorage.removeItem("nama_penitip"); // Pastikan nama_penitip juga dihapus

        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    // Fetch profil Pembeli
    const fetchPembeliProfile = async (token, pembeliId) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/pembeli/${pembeliId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPembeliProfile(response.data);
        } catch (err) {
            console.error("Error fetching pembeli profile:", err);
            // Jika 401, coba logout
            if (err.response?.status === 401) {
                 toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
                 handleLogout();
            } else {
                setError("Gagal memuat profil.");
            }
        }
    };

    // Fetch daftar alamat
    const fetchPembeliAddresses = async (token, search = '') => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/alamat`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search: search }
            });
            console.log("Fetched addresses:", response.data);
            // Pastikan response.data adalah array atau memiliki property 'data' yang array
            if (Array.isArray(response.data)) {
                setAddresses(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                setAddresses(response.data.data); // Handle jika data di property 'data'
            } else {
                console.error("Unexpected address data format:", response.data);
                setAddresses([]); // Kosongkan daftar jika format tidak sesuai
            }
        } catch (err) {
            console.error("Error fetching addresses:", err.response?.data || err.message);
             if (err.response?.status === 401) {
                 toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
                 handleLogout();
            } else {
                setError("Gagal memuat daftar alamat.");
            }
        }
    };

    // Fungsi untuk fetch diskusi produk milik Pembeli
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

        } catch (err) {
            console.error("Error fetching my discussions:", err.response?.data || err.message);
             if (err.response?.status === 401) {
                 toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
                 handleLogout();
            } else {
                 // Ini mungkin bukan error kritis, tampilkan pesan jika perlu tapi jangan kosongkan diskusi jika ada
                 // setError("Gagal memuat diskusi Anda."); // Opsi: tampilkan error di UI
                 console.warn("Failed to load discussions, but continuing.");
            }
        }
    };

    // Fungsi untuk fetch daftar barang (dengan search) untuk dipilih di modal diskusi
    const fetchProductsForDiscussion = async (token, search = '') => {
        try {
            // Mengambil daftar barang yang 'tersedia' atau 'dapat didiskusikan' jika ada endpoint spesifik
            // Jika tidak ada, gunakan endpoint barang biasa
            const response = await axios.get(`http://127.0.0.1:8000/api/barang`, { headers: { Authorization: `Bearer ${token}` }, params: { search: search } });
            console.log("Fetched products for discussion:", response.data);
            if (Array.isArray(response.data)) { setAvailableProducts(response.data); }
             else if (response.data && Array.isArray(response.data.data)) { setAvailableProducts(response.data.data); }
            else { console.error("Unexpected product data format:", response.data); setAvailableProducts([]); }
        } catch (err) {
            console.error("Error fetching products for discussion:", err.response?.data || err.message);
             if (err.response?.status === 401) {
                 toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
                 handleLogout();
            }
        }
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

            // Fetch data secara paralel jika memungkinkan untuk performa lebih baik
            await Promise.all([
                 fetchPembeliProfile(token, pembeliId),
                 fetchPembeliAddresses(token),
                 fetchMyDiscussions(token)
            ]);

            setLoading(false); // Selesai loading
        };

        fetchData();

    }, [navigate]); // Dependency array

     // Efek untuk fetch alamat saat searchTermAddress berubah
    useEffect(() => {
         const token = localStorage.getItem('authToken');
         if (token) {
             // Opsional: debounce ini jika pencarian API lambat
             const delayDebounceFn = setTimeout(() => {
                 fetchPembeliAddresses(token, searchTermAddress);
             }, 300); // Jeda 300ms setelah user berhenti mengetik

             return () => clearTimeout(delayDebounceFn); // Cleanup debounce timer
         }
    }, [searchTermAddress]);


    // Handler untuk input pencarian alamat
    const handleSearchAddressChange = (e) => {
        setSearchTermAddress(e.target.value);
        // Fetching dipindahkan ke useEffect dengan debounce
    };

    // Handler untuk input pencarian barang di modal diskusi (Debounce)
    const handleProductSearchChange = async (e) => {
         const searchTerm = e.target.value;
         setProductSearchTerm(searchTerm); // Update state input search barang

         // Panggil fetch products saat mengetik (dengan debounce)
         const token = localStorage.getItem('authToken');
         if (token) {
              // Debounce logika di sini atau langsung panggil fetch jika API cepat
              // Implementasi debounce sederhana:
              // Anda mungkin perlu useRef untuk menyimpan timeout ID
              // const debounceTimeoutRef = useRef(null);
              // clearTimeout(debounceTimeoutRef.current);
              // debounceTimeoutRef.current = setTimeout(async () => {
              //    if (searchTerm.length > 1 || searchTerm.length === 0) { // Trigger search setelah minimal 2 karakter
              //         await fetchProductsForDiscussion(token, searchTerm);
              //    }
              // }, 300);

             // Untuk saat ini, panggil langsung, tambahkan debounce jika perlu
             if (searchTerm.length > 1 || searchTerm.length === 0) {
                 await fetchProductsForDiscussion(token, searchTerm);
             }
         }
    };

    // Handler saat barang dipilih dari daftar di modal
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

    // --- Handler Alamat ---
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
            // Fetch ulang alamat setelah aksi berhasil, pertahankan searchTermAddress
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
            // Fetch ulang alamat setelah hapus, pertahankan searchTermAddress
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
    // Pastikan profile dan addresses/discussions tidak null sebelum render
     if (!pembeliProfile && addresses.length === 0 && myDiscussions.length === 0 && !loading && !error) {
         return <div className="empty-dashboard">Tidak ada data untuk ditampilkan.</div>; // Atau pesan lain
     }


    return (
    <div className="pembeli-dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART PEMBELI</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/pembeli/dashboard">Dashboard</Link></li>
          {/* Link ke halaman shop bisa ditambahkan */}
          {/* <li><Link to="/shop">Shop</Link></li> */}
          <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
        </ul>
      </nav>

      {/* Konten Dashboard */}
      <div className="dashboard-container">
        <h2>Dashboard Pembeli</h2>

        {/* Bagian Profil Pembeli */}
        <div className="dashboard-section">
          <h3>Profil Anda</h3>
          {pembeliProfile ? (
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
            <p>Profil tidak dapat dimuat.</p>
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
          <div className="search-bar" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Cari Alamat..."
              value={searchTermAddress}
              onChange={handleSearchAddressChange}
              style={{ padding: '0.5rem', width: '100%', borderRadius: '5px', border: '1px solid #ddd' }}
            />
          </div>

          {/* Tampilan Alamat dalam Tabel */}
          <div className="table-container"> {/* Container untuk overflow horizontal */}
            {addresses.length > 0 ? (
              <table className="address-table">
                <thead>
                  <tr>
                    <th>Alamat Lengkap</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {addresses.map(address => (
                    <tr key={address.id_alamat}>
                      <td>{address.alamat_lengkap}</td>
                      <td className="action-buttons">
                        <button onClick={() => handleEditAddressClick(address)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDeleteAddress(address.id_alamat)} className="delete-btn">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              searchTermAddress !== '' ? (
                <p>Tidak ditemukan alamat yang cocok dengan "{searchTermAddress}".</p>
              ) : (
                <p>Anda belum memiliki alamat tersimpan.</p>
              )
            )}
          </div> {/* Tutup table-container */}
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

          {/* Tampilan Diskusi dalam Tabel */}
          <div className="table-container"> {/* Container untuk overflow horizontal */}
            {myDiscussions.length > 0 ? (
              <table className="discussion-table">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Komentar Pembeli</th>
                    <th>Balasan CS</th>
                  </tr>
                </thead>
                <tbody>
                  {myDiscussions.map(discussion => (
                    <tr key={discussion.id_diskusi}>
                      <td className="product-cell">
                         {/* Tampilkan Foto dan Nama Barang */}
                         {discussion.barang ? (
                             <div className="product-info-cell">
                                 {discussion.barang.image && (
                                     <img
                                         src={`http://127.0.0.1:8000/images/${discussion.barang.image}`}
                                         alt={discussion.barang.nama_barang || 'Barang'}
                                         className="product-image-small"
                                     />
                                 )}
                                 <span>{discussion.barang.nama_barang || 'N/A'}</span>
                             </div>
                         ) : (
                             <span>Barang tidak tersedia</span> // Atau pesan lain jika barang terkait dihapus
                         )}
                      </td>
                      <td>{discussion.komentar_pembeli}</td>
                      <td>
                        {discussion.komentar_pegawai ? (
                          <div>
                            <strong>CS ({discussion.pegawai?.nama_pegawai || 'N/A'}):</strong> {discussion.komentar_pegawai}
                          </div>
                        ) : (
                          <em style={{ color: '#666' }}>Menunggu balasan...</em>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Anda belum mengajukan diskusi produk.</p>
            )}
          </div> {/* Tutup table-container */}
        </div>
      </div> {/* Tutup dashboard-container */}

      {/* Modal Tambah / Edit Alamat */}
      {showAddressModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingAddress ? "Edit Alamat" : "Tambah Alamat Baru"}</h3>
              <button className="close-btn" onClick={handleCloseAddressModal}>&times;</button> {/* Simbol X */}
            </div>
            <form onSubmit={handleAddressSubmit}>
              <div className="form-group">
                 <label htmlFor="alamat_lengkap">Alamat Lengkap:</label>
                  <textarea
                    id="alamat_lengkap"
                    placeholder="Masukkan alamat lengkap Anda"
                    name="alamat_lengkap"
                    value={addressFormData.alamat_lengkap}
                    onChange={(e) => setAddressFormData({ ...addressFormData, alamat_lengkap: e.target.value })}
                    required
                    rows="4"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '0.95rem' }}
                  ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseAddressModal}>Batal</button>
                <button type="submit" className="submit-btn">{editingAddress ? "Perbarui Alamat" : "Simpan Alamat"}</button>
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
              <button className="close-btn" onClick={handleCloseAddDiscussionModal}>&times;</button> {/* Simbol X */}
            </div>

            <form onSubmit={handleDiscussionSubmit}>
              <div className="form-grid"> {/* Use a form grid for better layout */}
                {/* Bagian Pilih Barang */}
                <div className="form-group" style={{ gridColumn: '1 / -1', position: 'relative' }}> {/* Relative for absolute positioning of suggestions */}
                  <label htmlFor="productSearch">Pilih Barang:</label>
                  <input
                    type="text"
                    id="productSearch"
                    placeholder="Cari nama barang..."
                    value={productSearchTerm}
                    onChange={handleProductSearchChange}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '0.95rem' }}
                    autoComplete="off" // Matikan autocomplete browser
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
                      position: 'absolute', // Absolute positioning relative to parent .form-group
                      width: 'calc(100% - 2px)', // Sesuaikan lebar agar pas dengan input
                      left: '0',
                      top: '100%', // Letakkan di bawah input
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
                  <div className="form-group selected-product-display" style={{
                    gridColumn: '1 / -1',
                    border: '1px solid #eee',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    backgroundColor: '#f9f9f9'
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
                  disabled={!selectedProduct || loading} // Disable jika barang belum dipilih atau sedang loading
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