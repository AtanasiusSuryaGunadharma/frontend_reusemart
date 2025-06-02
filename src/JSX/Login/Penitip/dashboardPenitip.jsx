/* eslint-disable no-case-declarations */
import React, { useState, useEffect } from "react";
import "./dashboardPenitip.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const PenitipDashboard = () => {
    const [penitipProfile, setPenitipProfile] = useState(null);
    const [consignmentHistory, setConsignmentHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
    const [currentDaftarPage, setCurrentDaftarPage] = useState(1);
    const [currentPerpanjangPage, setCurrentPerpanjangPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchPerpanjang, setSearchPerpanjang] = useState("");
    const itemsPerPage = 7;

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    const fetchPenitipProfile = async (token, penitipId) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/penitip/${penitipId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPenitipProfile(response.data);
        } catch (err) {
            console.error("Error fetching penitip profile:", err);
            if (err.response?.status === 401) handleLogout();
            setError(err.response?.data?.message || "Gagal memuat profil penitip.");
        }
    };

    const fetchConsignmentHistory = async (token) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/transaksi-penitipan/my-history`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConsignmentHistory(Array.isArray(response.data) ? response.data : []);
            // Ambil pesan notifikasi dari histori transaksi dan masukkan ke state notifications
            const newNotifications = [];
            response.data.forEach(transaction => {
                if (transaction.notification_message) {
                    // Asumsi notification_message terkait dengan transaksi keseluruhan,
                    // dan bisa saja butuh detail barang jika itu notifikasi per barang.
                    // Untuk kesederhanaan, kita akan tambahkan pesan transaksi utama.
                    // Jika Anda ingin notifikasi per barang, logic ini perlu disesuaikan
                    // agar mengambil detail barang yang relevan ke dalam notifikasi.data.
                    newNotifications.push({
                        id: `transaksi-${transaction.id_penitipan_transaksi}-${Date.now()}`, // ID unik
                        message: transaction.notification_message,
                        created_at: transaction.updated_at || transaction.created_at, // Gunakan timestamp yang relevan
                        data: transaction.detail_transaksi_penitipans && transaction.detail_transaksi_penitipans.length > 0
                            ? {
                                  image: transaction.detail_transaksi_penitipans[0].barang?.image,
                                  nama_barang: transaction.detail_transaksi_penitipans[0].barang?.nama_barang
                              }
                            : null
                    });
                }
            });
            setNotifications(prevNotifs => [...prevNotifs, ...newNotifications]); // Gabungkan dengan notifikasi yang mungkin sudah ada
        } catch (err) {
            console.error("Error fetching consignment history:", err);
            setError(err.response?.data?.message || "Gagal memuat histori transaksi.");
            if (err.response?.status === 401) handleLogout();
            setConsignmentHistory([]);
        }
    };

    // Ini adalah fungsi untuk mengambil notifikasi dari endpoint notifikasi (jika ada)
    // Jika semua notifikasi berasal dari consignment history, fungsi ini mungkin tidak diperlukan
    // atau hanya untuk notifikasi khusus yang tidak terkait langsung dengan transaksi.
    const fetchAdditionalNotifications = async (token) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/penitip/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Gabungkan notifikasi dari endpoint ini dengan yang sudah ada (dari histori)
            setNotifications(prevNotifs => {
                const existingIds = new Set(prevNotifs.map(n => n.id));
                const newNotifs = response.data.filter(n => !existingIds.has(n.id));
                return [...prevNotifs, ...newNotifs];
            });
        } catch (err) {
            console.error("Error fetching additional notifications:", err);
            // Hanya log error, jangan tampilkan toast error yang mengganggu jika ini hanya 'tambahan'
        }
    };


    const handleExtendConsignment = async (detailId) => {
        const token = localStorage.getItem("authToken");
        try {
            await axios.post(
                `http://127.0.0.1:8000/api/perpanjang-penitipan/${detailId}`,
                { status_perpanjangan: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Masa penitipan berhasil diperpanjang 30 hari!");
            await fetchConsignmentHistory(token);
        } catch (err) {
            console.error("Error extending consignment:", err);
            toast.error("Gagal memperpanjang masa penitipan.");
        }
    };

    const getAllItems = () => {
        const allItems = [];
        consignmentHistory.forEach((transaction) => {
            transaction.detail_transaksi_penitipans?.forEach((detail) => {
                if (detail.barang) {
                    allItems.push({
                        ...detail,
                        transaction_id: transaction.id_penitipan_transaksi,
                        tanggal_akhir_penitipan: transaction.tanggal_akhir_penitipan,
                        status_penitipan: transaction.status_penitipan,
                        // notification_message tidak lagi diambil di sini
                    });
                }
            });
        });
        return allItems;
    };

    const getFilteredItems = (items, search) => {
        if (!search) return items;
        const searchLower = search.toLowerCase();
        return items.filter((item) => {
            if (!item.barang) return false;
            const barang = item.barang;
            return (
                (barang.id_barang?.toString().includes(searchLower)) ||
                (barang.nama_barang?.toLowerCase().includes(searchLower)) ||
                (barang.deskripsi_barang?.toLowerCase().includes(searchLower)) ||
                (item.tanggal_akhir_penitipan?.toLowerCase().includes(searchLower)) ||
                (item.status_penitipan?.toLowerCase().includes(searchLower))
            );
        });
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const penitipId = localStorage.getItem("id_penitip");
        const userRole = localStorage.getItem("userRole");

        if (!token || !penitipId || userRole !== "penitip") {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            await fetchPenitipProfile(token, penitipId);
            await fetchConsignmentHistory(token);
            await fetchAdditionalNotifications(token); // Panggil untuk notifikasi tambahan jika ada
            setLoading(false);
        };
        fetchData();
    }, [navigate]);

    if (loading) return <div className="penitip-loading-state">Memuat Dashboard...</div>;
    if (error) return <div className="penitip-error-state">Error: {error}</div>;

    const notificationCount = notifications.length;

    const renderContent = () => {
        switch (activeMenu) {
            case "dashboard":
                return (
                    <div className="penitip-dashboard-section">
                        <h3>Profil Anda</h3>
                        {penitipProfile ? (
                            <table className="penitip-profile-table">
                                <tbody>
                                    <tr><td><strong>ID</strong></td><td>{penitipProfile.id_penitip}</td></tr>
                                    <tr><td><strong>Nama</strong></td><td>{penitipProfile.nama_penitip}</td></tr>
                                    <tr><td><strong>Email</strong></td><td>{penitipProfile.email_penitip}</td></tr>
                                    <tr><td><strong>No Telepon</strong></td><td>{penitipProfile.no_telepon_penitip}</td></tr>
                                    <tr><td><strong>Tanggal Lahir</strong></td><td>{penitipProfile.tgl_lahir_penitip}</td></tr>
                                    <tr><td><strong>Rating</strong></td><td>{penitipProfile.rating_penitip}</td></tr>
                                    <tr><td><strong>Saldo</strong></td><td>Rp. {Number(penitipProfile.pendapatan_penitip || 0).toLocaleString('id-ID')}</td></tr>
                                    <tr><td><strong>Bonus Terjual Cepat</strong></td><td>Rp. {Number(penitipProfile.bonus_terjual_cepat || 0).toLocaleString('id-ID')}</td></tr>
                                    <tr><td><strong>Reward Sosial</strong></td><td>Rp. {Number(penitipProfile.reward_program_sosial || 0).toLocaleString('id-ID')}</td></tr>
                                </tbody>
                            </table>
                        ) : (
                            <p>Profil tidak dapat dimuat.</p>
                        )}
                    </div>
                );

            case "history":
                const indexOfLastHistory = currentHistoryPage * itemsPerPage;
                const indexOfFirstHistory = indexOfLastHistory - itemsPerPage;
                const currentHistory = consignmentHistory.slice(indexOfFirstHistory, indexOfLastHistory);
                const totalHistoryPages = Math.ceil(consignmentHistory.length / itemsPerPage);

                return (
                    <div className="penitip-dashboard-section">
                        <h3>History Transaksi Penitipan</h3>
                        {consignmentHistory.length > 0 ? (
                            <>
                                {currentHistory.map((transaction) => (
                                    <div key={transaction.id_penitipan_transaksi || Math.random()} className="penitip-transaction-table-wrapper">
                                        <h4>ID Transaksi: {transaction.id_penitipan_transaksi}</h4>
                                        <table className="penitip-transaction-table">
                                            <thead>
                                                <tr>
                                                    <th>Tanggal Mulai</th>
                                                    <th>Tanggal Akhir</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>{transaction.tanggal_mulai_penitipan || "Tidak Diketahui"}</td>
                                                    <td>{transaction.tanggal_akhir_penitipan || "Tidak Diketahui"}</td>
                                                    <td>{transaction.status_penitipan || "Tidak Diketahui"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <h5>Detail Barang</h5>
                                        <table className="penitip-transaction-detail-table">
                                            <thead>
                                                <tr>
                                                    <th>Nama Barang</th>
                                                    <th>Jumlah Titip</th>
                                                    <th>Terjual</th>
                                                    <th>Gagal Terjual</th>
                                                    <th>Bonus</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transaction.detail_transaksi_penitipans?.map((detail) => (
                                                    <tr key={detail.id_penitipan_detail_transaksi || Math.random()}>
                                                        <td>{detail.barang?.nama_barang || "N/A"}</td>
                                                        <td>{detail.jumlah_barang_penitip || 0}</td>
                                                        <td>{detail.jumlah_item_terjual || 0}</td>
                                                        <td>{detail.jumlah_item_gagal_terjual || 0}</td>
                                                        <td>Rp. {Number(detail.bonus_penitip || 0).toLocaleString('id-ID')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                                <div className="penitip-pagination">
                                    <button
                                        className="penitip-paginate-btn"
                                        onClick={() => setCurrentHistoryPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentHistoryPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            className={`penitip-paginate-btn ${currentHistoryPage === number ? "penitip-active" : ""}`}
                                            onClick={() => setCurrentHistoryPage(number)}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        className="penitip-paginate-btn"
                                        onClick={() => setCurrentHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages))}
                                        disabled={currentHistoryPage === totalHistoryPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>Belum ada histori transaksi penitipan.</p>
                        )}
                    </div>
                );

            case "daftarBarang":
                const allItemsDaftar = getAllItems();
                const filteredItemsDaftar = getFilteredItems(allItemsDaftar, searchTerm);
                const indexOfLastDaftar = currentDaftarPage * itemsPerPage;
                const indexOfFirstDaftar = indexOfLastDaftar - itemsPerPage;
                const currentDaftar = filteredItemsDaftar.slice(indexOfFirstDaftar, indexOfLastDaftar);
                const totalDaftarPages = Math.ceil(filteredItemsDaftar.length / itemsPerPage);

                return (
                    <div className="penitip-dashboard-section">
                        <h3>Daftar Barang</h3>
                        <div className="penitip-search-container">
                            <i className="fas fa-search penitip-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Cari barang (ID, nama, dll...)"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentDaftarPage(1);
                                }}
                                className="penitip-search-input"
                            />
                        </div>
                        {filteredItemsDaftar.length > 0 ? (
                            <>
                                <table className="penitip-daftar-table">
                                    <thead>
                                        <tr>
                                            <th>ID Barang</th>
                                            <th>Nama Barang</th>
                                            <th>Tanggal Akhir Penitipan</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentDaftar.map((item) => (
                                            <tr key={`${item.transaction_id}-${item.barang?.id_barang || 'unknown'}`}>
                                                <td>{item.barang?.id_barang || 'N/A'}</td>
                                                <td>{item.barang?.nama_barang || 'N/A'}</td>
                                                <td>{item.tanggal_akhir_penitipan || 'Tidak Diketahui'}</td>
                                                <td>{item.status_penitipan || 'Tidak Diketahui'}</td>
                                                <td>
                                                    <button
                                                        className="penitip-detail-btn"
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="penitip-pagination">
                                    <button
                                        className="penitip-paginate-btn"
                                        onClick={() => setCurrentDaftarPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentDaftarPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalDaftarPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            className={`penitip-paginate-btn ${currentDaftarPage === number ? "penitip-active" : ""}`}
                                            onClick={() => setCurrentDaftarPage(number)}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        className="penitip-paginate-btn"
                                        onClick={() => setCurrentDaftarPage((prev) => Math.min(prev + 1, totalDaftarPages))}
                                        disabled={currentDaftarPage === totalDaftarPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>{searchTerm ? "Tidak ada barang yang sesuai dengan pencarian." : "Belum ada barang yang dititipkan."}</p>
                        )}
                        {showModal && selectedItem && (
                            <div className="penitip-modal">
                                <div className="penitip-modal-content">
                                    <h3>Detail Barang</h3>
                                    <div className="penitip-modal-details">
                                        <p><strong>ID Barang:</strong> {selectedItem.barang?.id_barang || 'N/A'}</p>
                                        <p><strong>Nama Barang:</strong> {selectedItem.barang?.nama_barang || 'N/A'}</p>
                                        <p><strong>Deskripsi:</strong> {selectedItem.barang?.deskripsi_barang || 'Tidak ada'}</p>
                                        <p><strong>Harga:</strong> Rp. {Number(selectedItem.barang?.harga_barang || 0).toLocaleString('id-ID')}</p>
                                        <p><strong>Berat:</strong> {Number(selectedItem.barang?.berat_barang || 0).toLocaleString('id-ID')} KG</p>
                                        <p><strong>Status:</strong> {selectedItem.status_penitipan || 'Tidak Diketahui'}</p>
                                        <p><strong>Tanggal Akhir Penitipan:</strong> {selectedItem.tanggal_akhir_penitipan || 'Tidak Diketahui'}</p>
                                        {selectedItem.barang?.image && (
                                            <div className="penitip-images-container">
                                                <div className="penitip-image-wrapper">
                                                    <img src={`http://127.0.0.1:8000/images/${selectedItem.barang.image}`} alt="Barang" className="penitip-item-photo" />
                                                </div>
                                                {selectedItem.barang?.image2 && (
                                                    <div className="penitip-image-wrapper">
                                                        <img src={`http://127.0.0.1:8000/images/${selectedItem.barang.image2}`} alt="Barang 2" className="penitip-item-photo" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <button className="penitip-close-btn" onClick={() => setShowModal(false)}>Tutup</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "perpanjangPenitipan":
                const allItemsPerpanjang = getAllItems();
                const filteredItemsPerpanjang = getFilteredItems(allItemsPerpanjang, searchPerpanjang);
                const indexOfLastPerpanjang = currentPerpanjangPage * itemsPerPage;
                const indexOfFirstPerpanjang = indexOfLastPerpanjang - itemsPerPage;
                const currentPerpanjang = filteredItemsPerpanjang.slice(indexOfFirstPerpanjang, indexOfLastPerpanjang);
                const totalPerpanjangPages = Math.ceil(filteredItemsPerpanjang.length / itemsPerPage);

                return (
                    <div className="penitip-dashboard-section">
                        <h3>Perpanjang Masa Penitipan</h3>
                        <div className="penitip-search-container">
                            <i className="fas fa-search penitip-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Cari barang untuk diperpanjang..."
                                value={searchPerpanjang}
                                onChange={(e) => {
                                    setSearchPerpanjang(e.target.value);
                                    setCurrentPerpanjangPage(1);
                                }}
                                className="penitip-search-input"
                            />
                        </div>
                        {filteredItemsPerpanjang.length > 0 ? (
                            <>
                                <table className="penitip-daftar-table">
                                    <thead>
                                        <tr>
                                            <th>ID Barang</th>
                                            <th>Nama Barang</th>
                                            <th>Tanggal Akhir Penitipan</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentPerpanjang.map((item) => (
                                            <tr key={`${item.transaction_id}-${item.barang?.id_barang || 'unknown'}`}>
                                                <td>{item.barang?.id_barang || 'N/A'}</td>
                                                <td>{item.barang?.nama_barang || 'N/A'}</td>
                                                <td>{item.tanggal_akhir_penitipan || 'Tidak Diketahui'}</td>
                                                <td>{item.status_penitipan || 'Tidak Diketahui'}</td>
                                                <td>
                                                    <button
                                                        className="penitip-extend-btn"
                                                        onClick={() => item.id_penitipan_detail_transaksi && handleExtendConsignment(item.id_penitipan_detail_transaksi)}
                                                        disabled={item.status_penitipan === "Selesai" || !item.id_penitipan_detail_transaksi}
                                                    >
                                                        Perpanjang +30 Hari
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="penitip-pagination">
                                    <button
                                        className="penitip-paginate-btn"
                                        onClick={() => setCurrentPerpanjangPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPerpanjangPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPerpanjangPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            className={`penitip-paginate-btn ${currentPerpanjangPage === number ? "penitip-active" : ""}`}
                                            onClick={() => setCurrentPerpanjangPage(number)}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        className="penitip-paginate-btn"
                                        onClick={() => setCurrentPerpanjangPage((prev) => Math.min(prev + 1, totalPerpanjangPages))}
                                        disabled={currentPerpanjangPage === totalPerpanjangPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>{searchPerpanjang ? "Tidak ada barang yang sesuai." : "Belum ada barang yang dapat diperpanjang."}</p>
                        )}
                    </div>
                );

            case "notifications":
                return (
                    <div className="penitip-dashboard-section">
                        {/* Hapus <h3>Notifikasi Anda</h3> di sini */}
                        {loading && <div className="penitip-loading-state">Memuat notifikasi...</div>}
                        {error && <div className="penitip-error-state">Error: {error}</div>}
                        {!loading && !error && notifications.length > 0 ? (
                            <ul className="penitip-notification-list">
                                {notifications.map(notif => (
                                    <li key={notif.id} className="penitip-notification-item">
                                        <div className="notification-content">
                                            {notif.data && notif.data.image && (
                                                <img
                                                    src={`http://127.0.0.1:8000/images/${notif.data.image}`}
                                                    alt={notif.data.nama_barang || "Barang Laku"}
                                                    className="notification-image"
                                                />
                                            )}
                                            <p>{notif.message}</p>
                                        </div>
                                        <span className="notification-date">
                                            {new Date(notif.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !loading && !error && <p>Tidak ada notifikasi baru.</p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="penitip-dashboard">
            <aside className="penitip-sidebar">
                <div className="penitip-sidebar-logo">REUSEMART PENITIP</div>
                <nav className="penitip-sidebar-nav">
                    <ul>
                        <li className={activeMenu === "dashboard" ? "penitip-active" : ""} onClick={() => setActiveMenu("dashboard")}>
                            Dashboard
                        </li>
                        <li className={activeMenu === "history" ? "penitip-active" : ""} onClick={() => setActiveMenu("history")}>
                            History Transaksi
                        </li>
                        <li className={activeMenu === "daftarBarang" ? "penitip-active" : ""} onClick={() => setActiveMenu("daftarBarang")}>
                            Daftar Barang
                        </li>
                        <li className={activeMenu === "perpanjangPenitipan" ? "penitip-active" : ""} onClick={() => setActiveMenu("perpanjangPenitipan")}>
                            Perpanjang Penitipan
                        </li>
                        <li className={activeMenu === "notifications" ? "penitip-active" : ""} onClick={() => setActiveMenu("notifications")}>
                            Notifikasi {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
                        </li>
                        <li onClick={handleLogout} className="penitip-logout-btn">Logout</li>
                    </ul>
                </nav>
            </aside>
            <main className="penitip-dashboard-container">
                <h2>
                    {activeMenu === "dashboard" ? "Dashboard Penitip" :
                    activeMenu === "history" ? "History Transaksi Penitipan" :
                    activeMenu === "daftarBarang" ? "Daftar Barang" :
                    activeMenu === "perpanjangPenitipan" ? "Perpanjang Masa Penitipan" :
                    "Notifikasi"} {/* Label di main content diubah */}
                </h2>
                <p className="penitip-welcome-text">Selamat datang, {penitipProfile?.nama_penitip || "Penitip"}</p>
                {renderContent()}
            </main>
        </div>
    );
};

export default PenitipDashboard;