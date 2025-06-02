/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./transaksiHistory.css";

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedTransaksiId, setSelectedTransaksiId] = useState(null);
    const [selectedBarangId, setSelectedBarangId] = useState(null);
    const [rating, setRating] = useState(0);
    const [selectedBarangNama, setSelectedBarangNama] = useState(""); // Untuk menampilkan nama barang di modal rating

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("userRole");
        localStorage.removeItem("authToken");
        localStorage.removeItem("id_pembeli");
        localStorage.removeItem("nama_pembeli");
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
        localStorage.removeItem("nama_penitip");

        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    const fetchTransactions = async (token) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/transaksi-pembelian`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fetched transactions:", response.data);
            if (response.data.message === 'Tidak ada transaksi untuk pembeli ini.') {
                setTransactions([]);
            } else if (Array.isArray(response.data)) {
                setTransactions(response.data);
            } else {
                console.error("Unexpected transaction data format:", response.data);
                setTransactions([]);
            }
        } catch (err) {
            console.error("Error fetching transactions:", err.response?.data || err.message);
            setError(err.response?.data?.message || "Gagal memuat history transaksi.");
            if (err.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userRole = localStorage.getItem("userRole");

        if (!token || userRole !== "pembeli") {
            navigate("/generalLogin");
            toast.error("Anda harus login sebagai pembeli untuk melihat history transaksi.");
            return;
        }

        fetchTransactions(token);
    }, [navigate]);

    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedTransaction(null);
    };

    const handleShowRatingModal = (transaksiId, barangId, barangNama) => {
        setSelectedTransaksiId(transaksiId);
        setSelectedBarangId(barangId);
        setSelectedBarangNama(barangNama); // Simpan nama barang untuk ditampilkan di modal
        setShowRatingModal(true);
        setRating(0);
    };

    const handleCloseRatingModal = () => {
        setShowRatingModal(false);
        setSelectedTransaksiId(null);
        setSelectedBarangId(null);
        setSelectedBarangNama("");
        setRating(0);
    };

    const handleRatingChange = (value) => {
        console.log("Bintang diklik, nilai:", value); // Debug
        setRating(value);
    };

    const handleSubmitRating = async () => {
        if (!rating) {
            toast.error("Silakan pilih rating (1-5 bintang).");
            return;
        }

        if (!selectedBarangId) {
            toast.error("Tidak ada barang untuk dirating.");
            return;
        }

        const token = localStorage.getItem("authToken");
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/transaksi-pembelian/${selectedTransaksiId}/rate/${selectedBarangId}`,
                { rating },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(response.data.message || "Rating berhasil ditambahkan!");
            handleCloseRatingModal();
            fetchTransactions(token); // Refresh transaksi setelah rating
        } catch (err) {
            console.error("Error submitting rating:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal memberikan rating.");
        }
    };

    if (loading) return <div className="loading-state">Memuat History Transaksi...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="transaction-history-page">
            <nav className="navbar">
                <div className="logo">
                    <span>REUSEMART PEMBELI</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/shop-pembeli">Shop</Link></li>
                    <li><Link to="/pembeli/dashboard">Profil</Link></li>
                    <li><Link to="/cart">Keranjang</Link></li>
                    <li><Link to="/pembeli/history">History</Link></li>
                    <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                </ul>
            </nav>

            <div className="history-container">
                <h2>History Transaksi Anda</h2>
                <div className="table-container">
                    {transactions.length > 0 ? (
                        <table className="transaction-table">
                            <thead>
                                <tr>
                                    <th>No. Transaksi</th>
                                    <th>Tanggal Pembelian</th>
                                    <th>Jenis Pengiriman</th>
                                    <th>Total Bayar</th>
                                    <th>Status Pembayaran</th>
                                    <th>Status Pengiriman</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(transaction => (
                                    <tr key={transaction.id_pembelian}>
                                        <td>{transaction.nomor_transaksi_nota}</td>
                                        <td>{new Date(transaction.tanggal_pembelian).toLocaleDateString('id-ID')}</td>
                                        <td>{transaction.jenis_pengiriman}</td>
                                        <td>{transaction.total_bayar.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                                        <td>{transaction.status_pembayaran}</td>
                                        <td>{transaction.status_pengiriman}</td>
                                        <td>
                                            <button
                                                className="view-details-btn"
                                                onClick={() => handleViewDetails(transaction)}
                                            >
                                                Lihat Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="empty-history-message">
                            Anda belum memiliki riwayat transaksi. Yuk, <Link to="/shop-pembeli">mulai belanja!</Link>
                        </p>
                    )}
                </div>
            </div>

            {showDetailModal && selectedTransaction && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Detail Transaksi #{selectedTransaction.nomor_transaksi_nota}</h3>
                            <button className="close-btn" onClick={handleCloseDetailModal}>×</button>
                        </div>
                        <div className="transaction-details">
                            <p><strong>Tanggal Pembelian:</strong> {new Date(selectedTransaction.tanggal_pembelian).toLocaleDateString('id-ID')}</p>
                            <p><strong>Tanggal Pembayaran:</strong> {selectedTransaction.tanggal_pembayaran ? new Date(selectedTransaction.tanggal_pembayaran).toLocaleDateString('id-ID') : 'Belum Dibayar'}</p>
                            <p><strong>Jenis Pengiriman:</strong> {selectedTransaction.jenis_pengiriman}</p>
                            <p><strong>Total Harga:</strong> {selectedTransaction.total_harga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
                            <p><strong>Biaya Ongkir:</strong> {selectedTransaction.biaya_ongkir.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
                            <p><strong>Potongan Poin:</strong> {selectedTransaction.tukar_poin_potongan}</p>
                            <p><strong>Total Bayar:</strong> {selectedTransaction.total_bayar.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
                            <p><strong>Poin Pembelian:</strong> {selectedTransaction.poin_pembelian}</p>
                            <p><strong>Alamat Pengiriman:</strong> {selectedTransaction.alamat_pembeli}</p>
                            <p><strong>Status Pembayaran:</strong> {selectedTransaction.status_pembayaran}</p>
                            {selectedTransaction.bukti_pembayaran && (
                                <div>
                                    <strong>Bukti Pembayaran:</strong>
                                    {/* Perubahan di sini: akses gambar langsung dari folder public */}
                                    <img
                                        src={`http://127.0.0.1:8000/bukti_pembayaran/${selectedTransaction.bukti_pembayaran}`}
                                        alt="Bukti Pembayaran"
                                        className="bukti-pembayaran-img"
                                    />
                                </div>
                            )}
                            {selectedTransaction.detail_transaksi_pembelian && selectedTransaction.detail_transaksi_pembelian.length > 0 ? (
                                <div className="detail-items">
                                    <h4>Detail Barang:</h4>
                                    <table className="detail-items-table">
                                        <thead>
                                            <tr>
                                                <th>Nama Barang</th>
                                                <th>Jumlah</th>
                                                <th>Harga Satuan</th>
                                                <th>Subtotal</th>
                                                <th>Rating</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedTransaction.detail_transaksi_pembelian.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.barang?.nama_barang || 'N/A'}</td>
                                                    <td>{item.jumlah_barang_pembelian}</td>
                                                    <td>{item.barang?.harga_barang.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) || 'N/A'}</td>
                                                    <td>{(item.jumlah_barang_pembelian * (item.barang?.harga_barang || 0)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                                                    <td>
                                                        {selectedTransaction.status_pembayaran === 'dibayar' || selectedTransaction.status_pembayaran === 'valid' ? ( // Bisa rating jika status dibayar atau valid
                                                            item.rated === 'yes' ? (
                                                                <span>Sudah Dirating</span>
                                                            ) : (
                                                                <button
                                                                    className="rate-btn"
                                                                    onClick={() => handleShowRatingModal(selectedTransaction.id_pembelian, item.barang_id_detail_pembelian, item.barang?.nama_barang || 'N/A')}
                                                                >
                                                                    Beri Rating
                                                                </button>
                                                            )
                                                        ) : (
                                                            <span>Belum Dibayar</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>Tidak ada detail barang untuk transaksi ini.</p>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={handleCloseDetailModal}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {showRatingModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Beri Rating untuk Barang: {selectedBarangNama}</h3>
                            <button className="close-btn" onClick={handleCloseRatingModal}>×</button>
                        </div>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={`star ${rating >= star ? 'filled' : ''}`}
                                    onClick={() => handleRatingChange(star)}
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button className="submit-btn" onClick={handleSubmitRating}>Kirim Rating</button>
                            <button className="cancel-btn" onClick={handleCloseRatingModal}>Batal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;