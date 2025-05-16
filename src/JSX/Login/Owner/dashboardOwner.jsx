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
    const [showEditModal, setShowEditModal] = useState(false); // State untuk modal edit
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedHistory, setSelectedHistory] = useState(null); // State untuk history yang akan diedit
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
                setOwnerProfile(profileResponse.data);

                const donationRequestsResponse = await axios.get(
                    `http://127.0.0.1:8000/api/request-donasi`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setDonationRequests(donationRequestsResponse.data);

                const donationHistoryResponse = await axios.get(
                    `http://127.0.0.1:8000/api/donasi/history`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setDonationHistory(donationHistoryResponse.data);

                const itemsForDonationResponse = await axios.get(
                    `http://127.0.0.1:8000/api/barang/donated`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setItemsForDonation(itemsForDonationResponse.data);
            } catch (err) {
                console.error("Error fetching initial data:", err);
                toast.error("Gagal memuat data awal.");
                if (err.response && err.response.status === 401) {
                    handleLogout();
                }
            }
        };

        if (token && role === "owner") {
            fetchData();
        }
    }, [navigate]);

    const handleAllocateDonation = (request) => {
        setSelectedRequest(request);
        setAllocationData({
            barang_id_donasi: "",
            tanggal_donasi: "",
            nama_penerima: "",
        });
        setShowAllocationModal(true);
    };

    const handleEditDonation = (history) => {
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
                id_organisasi: selectedRequest.id_organisasi,
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
            setDonationHistory(updatedDonationHistoryResponse.data);

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
            // Langkah 1: Update status barang
            const updateBarangPayload = {
                status_barang: editData.status_barang,
                nama_barang: selectedHistory.barang.nama_barang,
                harga_barang: selectedHistory.barang.harga_barang,
                berat_barang: selectedHistory.barang.berat_barang,
                masa_penitipan_tenggat: selectedHistory.barang.masa_penitipan_tenggat,
                id_kategoribarang: selectedHistory.barang.id_kategoribarang,
                deskripsi_barang: selectedHistory.barang.deskripsi_barang,
                tanggal_garansi: selectedHistory.barang.tanggal_garansi,
            };

            await axios.put(
                `http://127.0.0.1:8000/api/barang/${selectedHistory.barang_id_donasi}`,
                updateBarangPayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Langkah 2: Update donasi
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

            // Langkah 3: Refresh history donasi
            const updatedDonationHistoryResponse = await axios.get(
                `http://127.0.0.1:8000/api/donasi/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDonationHistory(updatedDonationHistoryResponse.data);

            toast.success("Donasi berhasil diperbarui.");
            setShowEditModal(false);
            setSelectedHistory(null);
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

    return (
        <div className="owner-dashboard">
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

            <div className="dashboard-container">
                <h2>Dashboard Owner</h2>

                <div className="dashboard-section">
                    <h3>Profil Owner</h3>
                    {ownerProfile ? (
                        <div className="profile-details">
                            <p><strong>ID:</strong> {ownerProfile.id_pegawai}</p>
                            <p><strong>Nama:</strong> {ownerProfile.nama_pegawai}</p>
                            <p><strong>Email:</strong> {ownerProfile.email_pegawai}</p>
                            <p><strong>Jabatan:</strong> {ownerProfile.jabatan?.nama_jabatan || "Tidak Ada"}</p>
                            <p><strong>Role Sistem:</strong> {userRoleState || "Tidak Diketahui"}</p>
                        </div>
                    ) : (
                        <p>Memuat profil...</p>
                    )}
                </div>

                <div className="dashboard-section">
                    <h3>Daftar Request Donasi</h3>
                    <p>Semua permintaan donasi:</p>
                    {donationRequests.length > 0 ? (
                        <table className="donation-table">
                            <thead>
                                <tr>
                                    <th>Permintaan</th>
                                    <th>Alamat</th>
                                    <th>Organisasi</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donationRequests.map((request) => (
                                    <tr key={request.id_request_donasi}>
                                        <td>{request.request_barang_donasi}</td>
                                        <td>{request.alamat_req_donasi}</td>
                                        <td>{request.organisasi?.nama_organisasi || "Tidak Diketahui"}</td>
                                        <td>
                                            <button
                                                onClick={() => handleAllocateDonation(request)}
                                                className="allocate-btn"
                                            >
                                                Alokasi Donasi
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Tidak ada request donasi saat ini.</p>
                    )}
                </div>

                <div className="dashboard-section">
                    <h3>History Donasi</h3>
                    <p>Riwayat donasi ke organisasi:</p>
                    {donationHistory.length > 0 ? (
                        <table className="donation-table">
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
                                {donationHistory.map((history) => (
                                    <tr key={history.id_donasi}>
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
                                                className="edit-btn"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Belum ada riwayat donasi.</p>
                    )}
                </div>
            </div>

            {showAllocationModal && selectedRequest && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Alokasi Donasi untuk Request: {selectedRequest.request_barang_donasi}</h3>
                        <form onSubmit={handleAllocationSubmit}>
                            <div className="form-group">
                                <label htmlFor="barang_id_donasi">Pilih Barang:</label>
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
                                            {item.nama_barang} (Status: {item.status_barang})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="tanggal_donasi">Tanggal Donasi:</label>
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
                            <div className="form-group">
                                <label htmlFor="nama_penerima">Nama Penerima:</label>
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
                            <div className="modal-actions">
                                <button type="submit">Alokasi Donasi</button>
                                <button type="button" onClick={handleCloseAllocationModal}>Tutup</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && selectedHistory && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Edit Donasi: {selectedHistory.barang?.nama_barang}</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group">
                                <label htmlFor="edit_tanggal_donasi">Tanggal Donasi:</label>
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
                            <div className="form-group">
                                <label htmlFor="edit_nama_penerima">Nama Penerima:</label>
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
                            <div className="form-group">
                                <label htmlFor="edit_status_barang">Status Barang:</label>
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
                            <div className="modal-actions">
                                <button type="submit">Simpan</button>
                                <button type="button" onClick={handleCloseEditModal}>Tutup</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardOwner;