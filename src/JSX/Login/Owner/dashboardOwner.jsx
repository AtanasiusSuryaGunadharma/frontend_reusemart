import React, { useState, useEffect } from "react";
import "./dashboardOwner.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';

const DashboardOwner = () => {
    // State untuk Profil Owner
    const [ownerProfile, setOwnerProfile] = useState(null);
    
    // State untuk Daftar Request Donasi
    const [donationRequests, setDonationRequests] = useState([]);
    
    // State untuk History Donasi
    const [donationHistory, setDonationHistory] = useState([]);
    
    // State untuk Alokasi Donasi (barang yang siap didonasikan)
    const [itemsForDonation, setItemsForDonation] = useState([]);
    
    // State untuk Daftar Organisasi
    const [organizations, setOrganizations] = useState([]);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [allocationData, setAllocationData] = useState({
        nama_organisasi_penerima: "",
        tanggal_donasi: "",
        nama_penerima: "",
        request_donasi_id: "",
    });

    // State untuk Role
    const [userRoleState, setUserRoleState] = useState(null);

    const navigate = useNavigate();

    // Fetch data saat komponen dimuat
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const id_pegawai = localStorage.getItem("id_pegawai");
        const role = localStorage.getItem("userRole");

        setUserRoleState(role);

        if (!token || role !== 'owner') {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch Profil Owner
                const profileResponse = await axios.get(`http://127.0.0.1:8000/api/pegawai/${id_pegawai}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setOwnerProfile(profileResponse.data);

                // Fetch Daftar Request Donasi
                const donationRequestsResponse = await axios.get(`http://127.0.0.1:8000/api/request-donasi`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDonationRequests(donationRequestsResponse.data);

                // Fetch History Donasi
                const donationHistoryResponse = await axios.get(`http://127.0.0.1:8000/api/donasi/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Donation History Response:", donationHistoryResponse.data); // Debugging
                setDonationHistory(donationHistoryResponse.data);

                // Fetch Barang yang siap didonasikan
                const itemsForDonationResponse = await axios.get(`http://127.0.0.1:8000/api/barang/donated`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Items for Donation Response:", itemsForDonationResponse.data); // Debugging
                setItemsForDonation(itemsForDonationResponse.data);

                // Fetch Daftar Organisasi
                const organizationsResponse = await axios.get(`http://127.0.0.1:8000/api/organisasi`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setOrganizations(organizationsResponse.data);

            } catch (err) {
                console.error("Error fetching initial data:", err);
                toast.error("Gagal memuat data awal.");
                if (err.response && err.response.status === 401) {
                    handleLogout();
                }
            }
        };

        if (token && role === 'owner') {
            fetchData();
        }
    }, [navigate]);

    // Handler untuk alokasi donasi
    const handleAllocateDonation = (item) => {
        setSelectedDonation(item);
        setAllocationData({
            nama_organisasi_penerima: "",
            tanggal_donasi: "",
            nama_penerima: "",
            request_donasi_id: "",
        });
        setShowAllocationModal(true);
    };

    const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const id_pegawai = localStorage.getItem("id_pegawai"); // Pastikan id_pegawai tersedia
    if (!selectedDonation || !id_pegawai) return;

    try {
        // Langkah 1: Ubah status barang
        const updatePayload = {
            status_barang: "didonasikan", // Hanya ubah status
            // Gunakan data yang sudah ada dari selectedDonation untuk field wajib lainnya
            nama_barang: selectedDonation.nama_barang,
            harga_barang: selectedDonation.harga_barang,
            berat_barang: selectedDonation.berat_barang,
            masa_penitipan_tenggat: selectedDonation.masa_penitipan_tenggat,
            id_kategoribarang: selectedDonation.id_kategoribarang,
            // Opsional: deskripsi_barang dan tanggal_garansi bisa diabaikan jika tidak diubah
            deskripsi_barang: selectedDonation.deskripsi_barang,
            tanggal_garansi: selectedDonation.tanggal_garansi,
        };

        const updateResponse = await axios.put(
            `http://127.0.0.1:8000/api/barang/${selectedDonation.id_barang}`,
            updatePayload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        console.log("Update barang response:", updateResponse.data); // Debugging

        // Langkah 2: Buat entri donasi baru
        const donasiPayload = {
            nama_organisasi_penerima: allocationData.nama_organisasi_penerima,
            tanggal_donasi: allocationData.tanggal_donasi,
            nama_penerima: allocationData.nama_penerima,
            request_donasi_id: allocationData.request_donasi_id || null,
            barang_id_donasi: selectedDonation.id_barang,
            pegawai_id_donasi: id_pegawai,
        };

        const donasiResponse = await axios.post(
            `http://127.0.0.1:8000/api/donasi`,
            donasiPayload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        console.log("Create donasi response:", donasiResponse.data); // Debugging

        // Perbarui daftar barang untuk donasi
        setItemsForDonation(itemsForDonation.filter(item => item.id_barang !== selectedDonation.id_barang));
        // Ambil data donasi terbaru
        const updatedDonationHistoryResponse = await axios.get(`http://127.0.0.1:8000/api/donasi/history`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setDonationHistory(updatedDonationHistoryResponse.data);

        toast.success("Donasi berhasil dialokasikan.");
        setShowAllocationModal(false);
        setSelectedDonation(null);

    } catch (err) {
        console.error("Error allocating donation:", err.response?.data || err.message);
        const errorMessage = err.response?.data?.message || "Gagal mengalokasikan donasi.";
        toast.error(errorMessage);
    }
};

    const handleCloseAllocationModal = () => {
        setShowAllocationModal(false);
        setSelectedDonation(null);
        setAllocationData({ nama_organisasi_penerima: "", tanggal_donasi: "", nama_penerima: "", request_donasi_id: "" });
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

    return (
        <div className="owner-dashboard">
            {/* Navbar */}
            <nav className="navbar">
                <div className="logo">
                    <span>REUSEMART OWNER</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/owner/dashboard">Dashboard</Link></li>
                    <li><Link to="/owner/profile">Profil</Link></li>
                    <li><button onClick={handleLogout}>Logout</button></li>
                </ul>
            </nav>

            {/* Dashboard */}
            <div className="dashboard-container">
                <h2>Dashboard Owner</h2>

                {/* Bagian Profil Owner */}
                <div className="dashboard-section">
                    <h3>Profil Owner</h3>
                    {ownerProfile ? (
                        <div className="profile-details">
                            <p><strong>ID:</strong> {ownerProfile.id_pegawai}</p>
                            <p><strong>Nama:</strong> {ownerProfile.nama_pegawai}</p>
                            <p><strong>Email:</strong> {ownerProfile.email_pegawai}</p>
                            <p><strong>Jabatan:</strong> {ownerProfile.jabatan?.nama_jabatan || 'Tidak Ada'}</p>
                            <p><strong>Role Sistem:</strong> {userRoleState || 'Tidak Diketahui'}</p>
                        </div>
                    ) : (
                        <p>Memuat profil...</p>
                    )}
                </div>

                {/* Bagian Daftar Request Donasi */}
                <div className="dashboard-section">
                    <h3>Daftar Request Donasi</h3>
                    <p>Semua permintaan donasi:</p>
                    <div className="request-list">
                        {donationRequests.length > 0 ? (
                            donationRequests.map((request) => (
                                <div key={request.id_request_donasi} className="request-card">
                                    <span>
                                        Permintaan: {request.request_barang_donasi} - Alamat: {request.alamat_req_donasi} - Organisasi: {request.organisasi?.nama_organisasi || 'Tidak Diketahui'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p>Tidak ada request donasi saat ini.</p>
                        )}
                    </div>
                </div>

                {/* Bagian History Donasi */}
                <div className="dashboard-section">
                    <h3>History Donasi</h3>
                    <p>Riwayat donasi ke organisasi:</p>
                    <div className="history-list">
                        {donationHistory.length > 0 ? (
                            donationHistory.map((history) => (
                                <div key={history.id_donasi} className="history-card">
                                    <span>
                                        Barang: {history.barang?.nama_barang || 'Tidak Diketahui'} - Organisasi: {history.request_donasi?.organisasi?.nama_organisasi} - 
                                        Tanggal: {history.tanggal_donasi || 'Tidak Diketahui'} - Penerima: {history.nama_penerima || 'Tidak Diketahui'} - 
                                        Status: {history.barang?.status_barang || 'Tidak Diketahui'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p>Belum ada riwayat donasi.</p>
                        )}
                    </div>
                </div>

                {/* Bagian Alokasi Barang ke Organisasi */}
                <div className="dashboard-section">
                    <h3>Alokasi Barang ke Organisasi</h3>
                    <p>Barang yang siap didonasikan (status "untuk_donasi"):</p>
                    <div className="request-list">
                        {itemsForDonation.length > 0 ? (
                            itemsForDonation.map((item) => (
                                <div key={item.id_barang} className="request-card">
                                    <span>
                                        {item.nama_barang} - Status: {item.status_barang}
                                    </span>
                                    <div>
                                        <button onClick={() => handleAllocateDonation(item)}>
                                            Alokasi Donasi
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Tidak ada barang yang siap didonasikan saat ini.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Alokasi Donasi */}
            {showAllocationModal && selectedDonation && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Alokasi Donasi untuk {selectedDonation.nama_barang}</h3>
                        <form onSubmit={handleAllocationSubmit}>
                            <select
                                value={allocationData.nama_organisasi_penerima}
                                onChange={(e) => setAllocationData({ ...allocationData, nama_organisasi_penerima: e.target.value })}
                                required
                            >
                                <option value="">Pilih Organisasi</option>
                                {organizations.map((org) => (
                                    <option key={org.id_organisasi} value={org.nama_organisasi}>
                                        {org.nama_organisasi}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={allocationData.tanggal_donasi}
                                onChange={(e) => setAllocationData({ ...allocationData, tanggal_donasi: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Nama Penerima Donasi"
                                value={allocationData.nama_penerima}
                                onChange={(e) => setAllocationData({ ...allocationData, nama_penerima: e.target.value })}
                                required
                            />
                            <div className="modal-actions">
                                <button type="submit">Alokasi Donasi</button>
                                <button type="button" onClick={handleCloseAllocationModal}>Tutup</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardOwner;