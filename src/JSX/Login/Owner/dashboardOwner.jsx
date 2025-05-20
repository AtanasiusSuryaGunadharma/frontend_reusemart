/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./dashboardOwner.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const DashboardOwner = () => {
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [donationRequests, setDonationRequests] = useState([]);
    const [donationHistory, setDonationHistory] = useState([]);
    const [itemsForDonation, setItemsForDonation] = useState([]);
    const [userRoleState, setUserRoleState] = useState(null);
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [currentRequestsPage, setCurrentRequestsPage] = useState(1);
    const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
    const itemsPerPage = 7;

    const [allocationData, setAllocationData] = useState({
        barang_id_donasi: "",
        tanggal_donasi: "",
        nama_penerima: "",
    });
    const [editData, setEditData] = useState({
        tanggal_donasi: "",
        nama_penerima: "",
        status_barang: "",
    });

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const id_pegawai = localStorage.getItem("id_pegawai");
        const role = localStorage.getItem("userRole");

        setUserRoleState(role);

        if (!token || role !== "owner") {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
            return;
        }

        const fetchData = async () => {
            try {
                const profileResponse = await axios.get(
                    `http://127.0.0.1:8000/api/pegawai/${id_pegawai}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log("Profile:", profileResponse.data); // Log data profil
                setOwnerProfile(profileResponse.data || {});

                const donationRequestsResponse = await axios.get(
                    `http://127.0.0.1:8000/api/request-donasi`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log("Donation Requests:", donationRequestsResponse.data); // Log data request donasi
                setDonationRequests(Array.isArray(donationRequestsResponse.data) ? donationRequestsResponse.data : []);

                const donationHistoryResponse = await axios.get(
                    `http://127.0.0.1:8000/api/donasi/history`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log("Donation History:", donationHistoryResponse.data); // Log data history donasi
                setDonationHistory(Array.isArray(donationHistoryResponse.data) ? donationHistoryResponse.data : []);

                const itemsForDonationResponse = await axios.get(
                    `http://127.0.0.1:8000/api/barang/donated`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log("Items for Donation:", itemsForDonationResponse.data); // Log data barang untuk donasi
                setItemsForDonation(Array.isArray(itemsForDonationResponse.data) ? itemsForDonationResponse.data : []);
            } catch (err) {
                console.error("Error fetching initial data:", err);
                toast.error("Gagal memuat data awal: " + (err.response?.data?.message || err.message));
                setOwnerProfile({});
                setDonationRequests([]);
                setDonationHistory([]);
                setItemsForDonation([]);
            }
        };

        fetchData();
    }, [navigate]);

    const handleAllocateDonation = (request) => {
        if (!request || !request.id_request_donasi) {
            toast.error("Request tidak valid.");
            return;
        }
        setSelectedRequest(request);
        setAllocationData({
            barang_id_donasi: "",
            tanggal_donasi: "",
            nama_penerima: "",
        });
        setShowAllocationModal(true);
    };

    const handleEditDonation = (history) => {
        if (!history || !history.id_donasi) {
            toast.error("History donasi tidak valid.");
            return;
        }
        setSelectedHistory(history);
        setEditData({
            tanggal_donasi: history.tanggal_donasi || "",
            nama_penerima: history.nama_penerima || "",
            status_barang: history.barang?.status_barang || "didonasikan",
        });
        setShowEditModal(true);
    };

    const handleAllocationSubmit = async (e) => {
        e.preventDefault();

        if (!allocationData.barang_id_donasi) {
            toast.error("Pilih barang untuk didonasikan.");
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

        const currentDate = new Date().toISOString().split("T")[0];
        if (allocationData.tanggal_donasi < currentDate) {
            toast.error("Tanggal donasi tidak boleh sebelum hari ini.");
            return;
        }

        const token = localStorage.getItem("authToken");
        const id_pegawai = localStorage.getItem("id_pegawai");

        try {
            const selectedItem = itemsForDonation.find(
                (item) => item.id_barang === parseInt(allocationData.barang_id_donasi)
            );
            if (!selectedItem) {
                toast.error("Barang yang dipilih tidak ditemukan.");
                return;
            }

            const updatePayload = {
                status_barang: "didonasikan",
                nama_barang: selectedItem.nama_barang,
                harga_barang: selectedItem.harga_barang,
                berat_barang: selectedItem.berat_barang,
                masa_penitipan_tenggat: selectedItem.masa_penitipan_tenggat,
                id_kategoribarang: selectedItem.id_kategoribarang,
                deskripsi_barang: selectedItem.deskripsi_barang,
                tanggal_garansi: selectedItem.tanggal_garansi,
            };

            await axios.put(
                `http://127.0.0.1:8000/api/barang/${allocationData.barang_id_donasi}`,
                updatePayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const donasiPayload = {
                tanggal_donasi: allocationData.tanggal_donasi,
                nama_penerima: allocationData.nama_penerima,
                request_donasi_id: selectedRequest.id_request_donasi,
                barang_id_donasi: allocationData.barang_id_donasi,
                pegawai_id_donasi: id_pegawai,
                id_organisasi: selectedRequest.organisasi_id,
            };

            await axios.post(`http://127.0.0.1:8000/api/donasi`, donasiPayload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setItemsForDonation(
                itemsForDonation.filter(
                    (item) => item.id_barang !== parseInt(allocationData.barang_id_donasi)
                )
            );

            const updatedDonationHistoryResponse = await axios.get(
                `http://127.0.0.1:8000/api/donasi/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDonationHistory(Array.isArray(updatedDonationHistoryResponse.data) ? updatedDonationHistoryResponse.data : []);

            toast.success("Donasi berhasil dialokasikan.");
            setShowAllocationModal(false);
            setSelectedRequest(null);
        } catch (err) {
            console.error("Error allocating donation:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal mengalokasikan donasi.");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!editData.tanggal_donasi) {
            toast.error("Tanggal donasi tidak boleh kosong.");
            return;
        }

        if (!editData.nama_penerima.trim()) {
            toast.error("Nama penerima donasi tidak boleh kosong.");
            return;
        }

        const currentDate = new Date().toISOString().split("T")[0];
        if (editData.tanggal_donasi < currentDate) {
            toast.error("Tanggal donasi tidak boleh sebelum hari ini.");
            return;
        }

        const token = localStorage.getItem("authToken");

        try {
            const updateBarangPayload = {
                status_barang: editData.status_barang,
                nama_barang: selectedHistory.barang?.nama_barang || "",
                harga_barang: selectedHistory.barang?.harga_barang || 0,
                berat_barang: selectedHistory.barang?.berat_barang || 0,
                masa_penitipan_tenggat: selectedHistory.barang?.masa_penitipan_tenggat || null,
                id_kategoribarang: selectedHistory.barang?.id_kategoribarang || null,
                deskripsi_barang: selectedHistory.barang?.deskripsi_barang || "",
                tanggal_garansi: selectedHistory.barang?.tanggal_garansi || null,
            };

            await axios.put(
                `http://127.0.0.1:8000/api/barang/${selectedHistory.barang_id_donasi}`,
                updateBarangPayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updateDonasiPayload = {
                tanggal_donasi: editData.tanggal_donasi,
                nama_penerima: editData.nama_penerima,
                request_donasi_id: selectedHistory.request_donasi_id,
                barang_id_donasi: selectedHistory.barang_id_donasi,
                pegawai_id_donasi: selectedHistory.pegawai_id_donasi,
                id_organisasi: selectedHistory.id_organisasi,
            };

            await axios.put(
                `http://127.0.0.1:8000/api/donasi/${selectedHistory.id_donasi}`,
                updateDonasiPayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedDonationHistoryResponse = await axios.get(
                `http://127.0.0.1:8000/api/donasi/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDonationHistory(Array.isArray(updatedDonationHistoryResponse.data) ? updatedDonationHistoryResponse.data : []);

            toast.success("Donasi berhasil diperbarui.");
            setShowEditModal(false);
            setSelectedHistory(null);
            setCurrentHistoryPage(1);
        } catch (err) {
            console.error("Error updating donation:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal memperbarui donasi.");
        }
    };

    const handleCloseAllocationModal = () => {
        setShowAllocationModal(false);
        setSelectedRequest(null);
        setAllocationData({
            barang_id_donasi: "",
            tanggal_donasi: "",
            nama_penerima: "",
        });
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedHistory(null);
        setEditData({
            tanggal_donasi: "",
            nama_penerima: "",
            status_barang: "",
        });
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

    const indexOfLastRequest = currentRequestsPage * itemsPerPage;
    const indexOfFirstRequest = indexOfLastRequest - itemsPerPage;
    const currentRequests = donationRequests.slice(indexOfFirstRequest, indexOfLastRequest);
    const totalRequestsPages = Math.ceil(donationRequests.length / itemsPerPage);

    const paginateRequests = (pageNumber) => setCurrentRequestsPage(pageNumber);
    const nextRequestsPage = () => {
        if (currentRequestsPage < totalRequestsPages) setCurrentRequestsPage(currentRequestsPage + 1);
    };
    const prevRequestsPage = () => {
        if (currentRequestsPage > 1) setCurrentRequestsPage(currentRequestsPage - 1);
    };

    const indexOfLastHistory = currentHistoryPage * itemsPerPage;
    const indexOfFirstHistory = indexOfLastHistory - itemsPerPage;
    const currentHistory = donationHistory.slice(indexOfFirstHistory, indexOfLastHistory);
    const totalHistoryPages = Math.ceil(donationHistory.length / itemsPerPage);

    const paginateHistory = (pageNumber) => setCurrentHistoryPage(pageNumber);
    const nextHistoryPage = () => {
        if (currentHistoryPage < totalHistoryPages) setCurrentHistoryPage(currentHistoryPage + 1);
    };
    const prevHistoryPage = () => {
        if (currentHistoryPage > 1) setCurrentHistoryPage(currentHistoryPage - 1);
    };

    const renderContent = () => {
        switch (activeMenu) {
            case "dashboard":
                return (
                    <div className="owner-dashboard-section">
                        <h3>Profil Owner</h3>
                        {ownerProfile ? (
                            <div className="owner-profile-details">
                                <p><strong>ID:</strong> {ownerProfile.id_pegawai || "Tidak Diketahui"}</p>
                                <p><strong>Nama:</strong> {ownerProfile.nama_pegawai || "Tidak Diketahui"}</p>
                                <p><strong>Email:</strong> {ownerProfile.email_pegawai || "Tidak Diketahui"}</p>
                                <p><strong>Jabatan:</strong> {ownerProfile.jabatan?.nama_jabatan || "Tidak Ada"}</p>
                                <p><strong>Role Sistem:</strong> {userRoleState || "Tidak Diketahui"}</p>
                            </div>
                        ) : (
                            <p>Memuat profil...</p>
                        )}
                    </div>
                );
            case "requests":
                return (
                    <div className="owner-dashboard-section">
                        <h3>Daftar Request Donasi</h3>
                        <p>Semua permintaan donasi:</p>
                        {donationRequests.length > 0 ? (
                            <>
                                <table className="owner-donation-table">
                                    <thead>
                                        <tr>
                                            <th>Permintaan</th>
                                            <th>Alamat</th>
                                            <th>Organisasi</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRequests.map((request) => (
                                            <tr key={request.id_request_donasi || Math.random()}>
                                                <td>{request.request_barang_donasi || "Tidak Diketahui"}</td>
                                                <td>{request.alamat_req_donasi || "Tidak Diketahui"}</td>
                                                <td>{request.organisasi?.nama_organisasi || "Tidak Diketahui"}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleAllocateDonation(request)}
                                                        className="owner-allocate-btn"
                                                        disabled={!request.id_request_donasi}
                                                    >
                                                        Alokasi Donasi
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="owner-pagination">
                                    <button
                                        className="owner-paginate-btn"
                                        onClick={prevRequestsPage}
                                        disabled={currentRequestsPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalRequestsPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            className={`owner-paginate-btn ${currentRequestsPage === number ? "owner-active" : ""}`}
                                            onClick={() => paginateRequests(number)}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        className="owner-paginate-btn"
                                        onClick={nextRequestsPage}
                                        disabled={currentRequestsPage === totalRequestsPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>Tidak ada request donasi saat ini.</p>
                        )}
                    </div>
                );
            case "history":
                return (
                    <div className="owner-dashboard-section">
                        <h3>History Donasi</h3>
                        <p>Riwayat donasi ke organisasi:</p>
                        {donationHistory.length > 0 ? (
                            <>
                                <table className="owner-donation-table">
                                    <thead>
                                        <tr>
                                            <th>Barang</th>
                                            <th>Organisasi</th>
                                            <th>Tanggal Donasi</th>
                                            <th>Penerima</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentHistory.map((history) => (
                                            <tr key={history.id_donasi || Math.random()}>
                                                <td>{history.barang?.nama_barang || "Tidak Diketahui"}</td>
                                                <td>
                                                    {history.request_donasi?.organisasi?.nama_organisasi ||
                                                        history.organisasi?.nama_organisasi ||
                                                        "Tidak Diketahui"}
                                                </td>
                                                <td>{history.tanggal_donasi || "Tidak Diketahui"}</td>
                                                <td>{history.nama_penerima || "Tidak Diketahui"}</td>
                                                <td>{history.barang?.status_barang || "Tidak Diketahui"}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleEditDonation(history)}
                                                        className="owner-edit-btn"
                                                        disabled={!history.id_donasi}
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="owner-pagination">
                                    <button
                                        className="owner-paginate-btn"
                                        onClick={prevHistoryPage}
                                        disabled={currentHistoryPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            className={`owner-paginate-btn ${currentHistoryPage === number ? "owner-active" : ""}`}
                                            onClick={() => paginateHistory(number)}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        className="owner-paginate-btn"
                                        onClick={nextHistoryPage}
                                        disabled={currentHistoryPage === totalHistoryPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>Belum ada riwayat donasi.</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="owner-dashboard">
            <aside className="owner-sidebar">
                <div className="owner-sidebar-logo">REUSEMART OWNER</div>
                <nav className="owner-sidebar-nav">
                    <ul>
                        <li
                            className={activeMenu === "dashboard" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("dashboard")}
                        >
                            Dashboard
                        </li>
                        <li
                            className={activeMenu === "requests" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("requests")}
                        >
                            Daftar Request Donasi
                        </li>
                        <li
                            className={activeMenu === "history" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("history")}
                        >
                            History Donasi
                        </li>
                        <li onClick={handleLogout} className="owner-logout-btn">
                            Logout
                        </li>
                    </ul>
                </nav>
            </aside>

            <main className="owner-dashboard-container">
                <h2>
                    {activeMenu === "dashboard"
                        ? "Dashboard Owner"
                        : activeMenu === "requests"
                        ? "Daftar Request Donasi"
                        : "History Donasi"}
                </h2>
                <p className="owner-welcome-text">
                    Selamat datang, {ownerProfile?.nama_pegawai || "Owner"}
                </p>
                {renderContent()}

                {showAllocationModal && selectedRequest && (
                    <div className="owner-modal">
                        <div className="owner-modal-content">
                            <div className="owner-modal-header">
                                <h3>Alokasi Donasi untuk Request: {selectedRequest.request_barang_donasi || "Tidak Diketahui"}</h3>
                                <button className="owner-close-btn" onClick={handleCloseAllocationModal}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleAllocationSubmit}>
                                <div className="owner-form-group">
                                    <label htmlFor="barang_id_donasi">
                                        <i className="fas fa-box"></i> Pilih Barang:
                                    </label>
                                    <select
                                        id="barang_id_donasi"
                                        value={allocationData.barang_id_donasi}
                                        onChange={(e) =>
                                            setAllocationData({
                                                ...allocationData,
                                                barang_id_donasi: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">Pilih Barang untuk Didonasikan</option>
                                        {itemsForDonation.map((item) => (
                                            <option key={item.id_barang} value={item.id_barang}>
                                                {item.nama_barang} (Status: {item.status_barang || "Tidak Diketahui"})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="owner-form-group">
                                    <label htmlFor="tanggal_donasi">
                                        <i className="fas fa-calendar-alt"></i> Tanggal Donasi:
                                    </label>
                                    <input
                                        type="date"
                                        id="tanggal_donasi"
                                        value={allocationData.tanggal_donasi}
                                        onChange={(e) =>
                                            setAllocationData({
                                                ...allocationData,
                                                tanggal_donasi: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="owner-form-group">
                                    <label htmlFor="nama_penerima">
                                        <i className="fas fa-user"></i> Nama Penerima:
                                    </label>
                                    <input
                                        type="text"
                                        id="nama_penerima"
                                        placeholder="Nama Penerima Donasi"
                                        value={allocationData.nama_penerima}
                                        onChange={(e) =>
                                            setAllocationData({
                                                ...allocationData,
                                                nama_penerima: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="owner-modal-actions">
                                    <button type="submit" className="owner-submit-btn">
                                        <i className="fas fa-save"></i> Alokasi Donasi
                                    </button>
                                    <button
                                        type="button"
                                        className="owner-cancel-btn"
                                        onClick={handleCloseAllocationModal}
                                    >
                                        <i className="fas fa-times"></i> Tutup
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showEditModal && selectedHistory && (
                    <div className="owner-modal">
                        <div className="owner-modal-content">
                            <div className="owner-modal-header">
                                <h3>Edit Donasi: {selectedHistory.barang?.nama_barang || "Tidak Diketahui"}</h3>
                                <button className="owner-close-btn" onClick={handleCloseEditModal}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit}>
                                <div className="owner-form-group">
                                    <label htmlFor="edit_tanggal_donasi">
                                        <i className="fas fa-calendar-alt"></i> Tanggal Donasi:
                                    </label>
                                    <input
                                        type="date"
                                        id="edit_tanggal_donasi"
                                        value={editData.tanggal_donasi}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                tanggal_donasi: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="owner-form-group">
                                    <label htmlFor="edit_nama_penerima">
                                        <i className="fas fa-user"></i> Nama Penerima:
                                    </label>
                                    <input
                                        type="text"
                                        id="edit_nama_penerima"
                                        placeholder="Nama Penerima Donasi"
                                        value={editData.nama_penerima}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                nama_penerima: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="owner-form-group">
                                    <label htmlFor="edit_status_barang">
                                        <i className="fas fa-box"></i> Status Barang:
                                    </label>
                                    <select
                                        id="edit_status_barang"
                                        value={editData.status_barang}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                status_barang: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="didonasikan">Didonasikan</option>
                                        <option value="untuk_donasi">Untuk Donasi</option>
                                    </select>
                                </div>
                                <div className="owner-modal-actions">
                                    <button type="submit" className="owner-submit-btn">
                                        <i className="fas fa-save"></i> Simpan
                                    </button>
                                    <button
                                        type="button"
                                        className="owner-cancel-btn"
                                        onClick={handleCloseEditModal}
                                    >
                                        <i className="fas fa-times"></i> Tutup
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardOwner;