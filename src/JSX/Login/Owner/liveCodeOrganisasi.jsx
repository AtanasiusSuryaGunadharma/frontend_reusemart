/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./liveCodeOrganisasi.css"; // Import CSS
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify"; // Import toast

const LiveCodeOrganisasi = () => {
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [userRoleState, setUserRoleState] = useState(null);
    const [organizationsWithoutDonations, setOrganizationsWithoutDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const navigate = useNavigate();

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

    const fetchOrganizationsWithoutDonations = async (token) => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/organisasi/without-donations", {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Fetched Organizations Without Donations:", response.data);

            if (Array.isArray(response.data)) {
                setOrganizationsWithoutDonations(response.data);
            } else {
                console.error("Unexpected data format for organizations without donations:", response.data);
                setOrganizationsWithoutDonations([]);
            }
        } catch (err) {
            console.error("Error fetching organizations without donations:", err.response?.data || err.message);
            toast.error("Gagal memuat daftar organisasi tanpa donasi.");
            if (err.response?.status === 401) handleLogout();
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const id_pegawai = localStorage.getItem("id_pegawai");
        const userRole = localStorage.getItem("userRole");

        setUserRoleState(userRole);

        if (!token || !userRole || userRole !== "owner") {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini.");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
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

                await fetchOrganizationsWithoutDonations(token);
            } catch (err) {
                console.error("Error fetching initial data:", err);
                setError("Gagal memuat data awal.");
                toast.error("Gagal memuat data awal.");
                if (err.response && err.response.status === 401) {
                    handleLogout();
                }
            } finally {
                setLoading(false);
            }
        };

        if (token && id_pegawai && userRole === "owner") {
            fetchData();
        }
    }, [navigate]);

    // Handler untuk alokasi donasi
        const handleAllocateDonation = (item) => {
            setSelectedDonation(item);
            setAllocationData({
                id_organisasi: "",
                tanggal_donasi: "",
                nama_penerima: "",
                request_donasi_id: "",
            });   
            setShowAllocationModal(true);
        };

        const handleAllocationSubmit = async (e) => {
        e.preventDefault();

            // Validasi form
        if (!allocationData.id_organisasi) {
            toast.error("Organisasi penerima harus dipilih.");
            return;
        }

        if (!allocationData.tanggal_donasi) {
            toast.error("Tanggal donasi tidak boleh kosong.");
            return;
        }

        if (!allocationData.nama_penerima.trim()) {
            toast.error("Nama penerima donasi tidak boleh kosong.");
            return;
        }

        const currentDate = new Date().toISOString().split('T')[0];
        if (allocationData.tanggal_donasi < currentDate) {
            toast.error("Tanggal donasi tidak boleh sebelum hari ini.");
            return;
        }

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

            //const selectedOrg = organizations.find(org => org.nama_organisasi === allocationData.nama_organisasi_penerima);
            // Langkah 2: Buat entri donasi baru
            const donasiPayload = {
                tanggal_donasi: allocationData.tanggal_donasi,
                nama_penerima: allocationData.nama_penerima,
                request_donasi_id: allocationData.request_donasi_id || null,
                barang_id_donasi: selectedDonation.id_barang,
                pegawai_id_donasi: id_pegawai,
                id_organisasi: allocationData.id_organisasi,
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
            setAllocationData({
                id_organisasi: "",
                tanggal_donasi: "",
                nama_penerima: "",
                request_donasi_id: "",
            });    
    };

    if (loading) return <div className="loading-state">Memuat Data Live Code...</div>;
    if (error) return <div className="error-state">Error: {error}</div>;

    return (
        <div className="owner-dashboard">
            <nav className="navbar">
                <div className="logo">
                    <span>REUSEMART LIVECODE</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/owner/dashboard">Dashboard Owner</Link></li>
                    <li><Link to="/livecode/organisasi">Organisasi LiveCode</Link></li>
                    <li><button onClick={handleLogout}>Logout</button></li>
                </ul>
            </nav>

            <div className="dashboard-container">
                <h2>Live Code Organisasi</h2>

                <div className="dashboard-section">
                    <h3>History Donasi</h3>
                    <p>Riwayat donasi ke organisasi:</p>
                    <div className="history-list">
                        {donationHistory.length > 0 ? (
                            donationHistory.map((history) => (
                                <div key={history.id_donasi} className="history-card">
                                    <span>
                                        <strong>Organisasi:</strong> {history.request_donasi?.organisasi?.nama_organisasi || history.organisasi?.nama_organisasi} -  Barang: {history.barang?.nama_barang || 'Tidak Diketahui'} 
                                        {/* Tanggal: {history.tanggal_donasi || 'Tidak Diketahui'} - Penerima: {history.nama_penerima || 'Tidak Diketahui'} -  */}
                                        - Status: {history.barang?.status_barang || 'Tidak Diketahui'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p>Belum ada riwayat donasi.</p>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h3>Daftar Organisasi Belum Menerima Donasi</h3>
                    <p>Organisasi yang belum pernah tercatat mendapatkan barang donasi:</p>

                    <div className="organization-list employee-list">
                        {organizationsWithoutDonations.length > 0 ? (
                            organizationsWithoutDonations.map((org) => (
                                <div key={org.id_organisasi} className="organization-card employee-card">
                                    <span>
                                        <strong>Nama:</strong> {org.nama_organisasi} |
                                        <strong>Email:</strong> {org.email_organisasi} |
                                        <strong>Telp:</strong> {org.no_telepon_organisasi} |
                                        <strong>Alamat:</strong> {org.alamat_organisasi}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p>Semua organisasi sudah tercatat pernah menerima donasi, atau belum ada organisasi terdaftar.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveCodeOrganisasi;
