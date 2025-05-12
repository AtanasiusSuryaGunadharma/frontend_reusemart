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
    // State untuk daftar alamat Pembeli (akan menyimpan hasil filter dari backend)
    const [addresses, setAddresses] = useState([]);
    // State BARU untuk input pencarian alamat
    const [searchTermAddress, setSearchTermAddress] = useState('');

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

    // Handler Logout (sama seperti sebelumnya)
    const handleLogout = () => {
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
            const response = await axios.get(
                `http://127.0.0.1:8000/api/pembeli/${pembeliId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setPembeliProfile(response.data);
        } catch (err) {
            console.error("Error fetching pembeli profile:", err);
            if (err.response?.status === 401) handleLogout();
        }
    };

    // Fetch daftar alamat dengan dukungan search
    const fetchPembeliAddresses = async (token, search = '') => { // <-- Terima parameter search
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/alamat`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search: search } // <-- Kirim parameter search ke backend
            });
            console.log("Fetched addresses:", response.data);
            setAddresses(response.data); // State addresses akan berisi hasil filter dari backend
        } catch (err) {
            console.error("Error fetching addresses:", err.response?.data || err.message);
            setError("Gagal memuat daftar alamat.");
            if (err.response?.status === 401) handleLogout();
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
            await fetchPembeliProfile(token, pembeliId);
            // Fetch alamat awal tanpa search term
            await fetchPembeliAddresses(token);
            setLoading(false);
        };

        fetchData();
    }, [navigate]); // Dependency array


    // Handler BARU untuk input pencarian alamat
    const handleSearchAddressChange = (e) => {
        const searchTerm = e.target.value;
        setSearchTermAddress(searchTerm); // Update state input search
        const token = localStorage.getItem("authToken");
        if (token) {
            // Panggil fetchAddresses dengan searchTerm yang baru
            fetchPembeliAddresses(token, searchTerm);
        }
    };


    // Handler untuk membuka modal tambah alamat (sama seperti sebelumnya)
    const handleAddAddressClick = () => {
        setEditingAddress(null); // Mode tambah
        setAddressFormData({ alamat_lengkap: "" }); // Reset form state
        setShowAddressModal(true); // Buka modal
    };

    // Handler untuk membuka modal edit alamat (sama seperti sebelumnya)
    const handleEditAddressClick = (address) => {
        setEditingAddress(address); // Mode edit, simpan data alamat yang diedit
        setAddressFormData({ alamat_lengkap: address.alamat_lengkap }); // Isi form dengan data alamat
        setShowAddressModal(true); // Buka modal
    };

    // Submit form tambah/edit alamat di modal (sama seperti sebelumnya)
    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        const url = editingAddress
            ? `/api/alamat/${editingAddress.id_alamat}`
            : "/api/alamat"; // Endpoint PUT atau POST
        const method = editingAddress ? "put" : "post"; // Method HTTP PUT atau POST

        try {
            const response = await axios[method](
                `http://127.0.0.1:8000${url}`,
                addressFormData, // addressFormData berisi { alamat_lengkap: value }
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log("Address operation successful:", response.data);
            toast.success(
                response.data.message ||
                (editingAddress
                    ? "Alamat berhasil diperbarui"
                    : "Alamat berhasil ditambahkan")
            );

            // Fetch ulang daftar alamat setelah operasi berhasil, termasuk searchTerm saat ini
            const currentToken = localStorage.getItem('authToken');
            if(currentToken) {
                 await fetchPembeliAddresses(currentToken, searchTermAddress); // <-- Fetch ulang dengan searchTerm
            }


            handleCloseAddressModal(); // Tutup modal
        } catch (err) {
            console.error("Error saving address:", err.response?.data || err.message);
            const backendErrorMessage = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Gagal menyimpan alamat.');
            toast.error(backendErrorMessage);
        }
    };

    // Hapus alamat (sama seperti sebelumnya)
    const handleDeleteAddress = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
        const token = localStorage.getItem("authToken");
        try {
            await axios.delete(`http://127.0.0.1:8000/api/alamat/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Alamat berhasil dihapus.");
            // Fetch ulang daftar alamat setelah delete, termasuk searchTerm saat ini
             const currentToken = localStorage.getItem('authToken');
            if(currentToken) {
                 await fetchPembeliAddresses(currentToken, searchTermAddress); // <-- Fetch ulang dengan searchTerm
            }
        } catch (err) {
            console.error("Error deleting address:", err);
            toast.error(err.response?.data?.message || "Gagal menghapus alamat.");
        }
    };

    // Menutup modal (sama seperti sebelumnya)
    const handleCloseAddressModal = () => {
        setShowAddressModal(false);
        setEditingAddress(null); // Reset mode edit
        setAddressFormData({ alamat_lengkap: "" }); // Reset form
    };


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
                    {/* Tampilkan profil jika tidak loading dan data ada */}
                    {!loading && !error && pembeliProfile ? (
                        <div className="profile-details">
                            <p><strong>ID:</strong> {pembeliProfile.id_pembeli}</p>
                            <p><strong>Nama:</strong> {pembeliProfile.nama_pembeli}</p>
                            <p><strong>Username:</strong> {pembeliProfile.username_pembeli}</p>
                            <p><strong>Email:</strong> {pembeliProfile.email_pembeli}</p>
                            <p><strong>Nomor Telepon:</strong> {pembeliProfile.no_telepon_pembeli}</p>
                            {/* Sesuaikan format tanggal jika perlu */}
                            <p><strong>Tanggal Lahir:</strong> {pembeliProfile.tgl_lahir_pembeli}</p>
                            <p><strong>Poin Reward:</strong> {pembeliProfile.poin_loyalitas}</p>
                             {/* Link edit profil opsional */}
                             {/* <Link to="/pembeli/profile/edit" className="profile-link">Edit Profil</Link> */}
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

                    {/* Input Search Alamat */} {/* <-- BARU */}
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Cari Alamat..." // <-- Sesuaikan placeholder
                            value={searchTermAddress}
                            onChange={handleSearchAddressChange} // <-- Handler pencarian
                            style={{ padding: '0.5rem', width: '100%', borderRadius: '5px', border: '1px solid #ddd' }}
                        />
                    </div>


                    {/* Rendering Daftar Alamat */}
                    <div className="address-list employee-list" style={{ marginTop: '1rem' }}> {/* Tambah margin atas */}
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
                                // Pesan jika tidak ada alamat (termasuk hasil search kosong)
                                searchTermAddress !== '' ? (
                                     <p>Tidak ditemukan alamat yang cocok dengan "{searchTermAddress}".</p>
                                ) : (
                                     <p>Anda belum memiliki alamat tersimpan.</p>
                                )
                            )
                        )}
                    </div>
                </div>


                {/* Tambahkan bagian dashboard lain di sini jika diperlukan */}

            </div>


            {/* Modal Tambah / Edit Alamat */}
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
                                onChange={(e) =>
                                    setAddressFormData({
                                        ...addressFormData,
                                        alamat_lengkap: e.target.value,
                                    })
                                }
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
        </div>
    );
};

export default PembeliDashboard;