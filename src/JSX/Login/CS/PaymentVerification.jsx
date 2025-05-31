import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import "./paymentVerification.css"; // Buat CSS baru untuk halaman ini

const PaymentVerification = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [verifyingId, setVerifyingId] = useState(null); // State untuk melacak transaksi yang sedang diverifikasi
    const navigate = useNavigate();

    // State untuk search dan pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const transactionsPerPage = 5; // Jumlah transaksi per halaman

    const handleLogout = () => {
        localStorage.clear();
        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    const fetchTransactionsForVerification = async (token, search = '') => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/transaksi-pembelian", { // Menggunakan index dengan filter
                headers: { Authorization: `Bearer ${token}` },
                params: { search: search, needs_verification: true } // Kirim parameter untuk filter
            });
            setTransactions(response.data);
        } catch (err) {
            console.error("Error fetching transactions for verification:", err.response?.data || err.message);
            setError("Gagal memuat daftar transaksi untuk verifikasi.");
            if (err.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userRole = localStorage.getItem("userRole");

        if (!token || userRole !== 'cs') {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini. Hanya Customer Service yang diizinkan.");
            return;
        }

        fetchTransactionsForVerification(token, searchTerm);
    }, [navigate, searchTerm]);

    // Handler untuk search
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset page saat search berubah
    };

    // Handler untuk memverifikasi pembayaran
    const handleVerifyPayment = async (transactionId, isValid) => {
        if (!window.confirm(`Yakin ingin ${isValid ? 'memvalidasi' : 'menolak'} pembayaran ini?`)) return;

        setVerifyingId(transactionId); // Set ID transaksi yang sedang diverifikasi
        const token = localStorage.getItem("authToken");
        try {
            const response = await axios.put(`http://127.0.0.1:8000/api/transaksi-pembelian/${transactionId}`, {
                action: 'verify_payment',
                is_valid: isValid
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(response.data.message || `Pembayaran berhasil ${isValid ? 'divalidasi' : 'ditolak'}.`);
            // Refresh daftar transaksi setelah verifikasi
            fetchTransactionsForVerification(token, searchTerm);
        } catch (err) {
            console.error("Error verifying payment:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal memverifikasi pembayaran.");
        } finally {
            setVerifyingId(null); // Reset verifying ID
        }
    };

    // Logika paginasi
    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
    const totalPages = Math.ceil(transactions.length / transactionsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);


    if (loading) return <div className="payment-verification-loading-state">Memuat transaksi...</div>;
    if (error) return <div className="payment-verification-error-state">Error: {error}</div>;

    return (
        <div className="payment-verification-page">
            {/* Navbar CS */}
            <nav className="payment-verification-navbar">
                <div className="payment-verification-logo">
                    <img src="/Logo.png" alt="Reusemart Logo" />
                    <span>REUSEMART CS</span>
                </div>
                <ul className="payment-verification-nav-links">
                    <li><Link to="/cs/dashboard">Dashboard CS</Link></li>
                    <li><Link to="/cs/payment-verification">Verifikasi Pembayaran</Link></li>
                    <li><button onClick={handleLogout} className="payment-verification-logout-btn">Logout</button></li>
                </ul>
            </nav>

            {/* Konten Verifikasi Pembayaran */}
            <div className="payment-verification-container">
                <h2>Verifikasi Pembayaran Transaksi</h2>

                <div className="payment-verification-search-bar">
                    <input
                        type="text"
                        placeholder="Cari No. Transaksi atau Nama Pembeli..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                {currentTransactions.length === 0 ? (
                    <p className="payment-verification-empty-message">Tidak ada transaksi yang menunggu verifikasi.</p>
                ) : (
                    <div className="payment-verification-list">
                        {currentTransactions.map(transaction => (
                            <div className="transaction-card" key={transaction.id_pembelian}>
                                <div className="card-header">
                                    <h4>No. Transaksi: {transaction.nomor_transaksi_nota}</h4>
                                    <span>Pembeli: {transaction.pembeli?.nama_pembeli || 'N/A'}</span>
                                </div>
                                <div className="card-body">
                                    <p>Total Bayar: **Rp {Number(transaction.total_bayar).toLocaleString('id-ID')}**</p>
                                    <p>Tanggal Pembayaran: {transaction.tanggal_pembayaran ? new Date(transaction.tanggal_pembayaran).toLocaleDateString('id-ID') : 'Belum Upload'}</p>
                                    <p>Status Pembayaran: <span className={`payment-status ${transaction.status_pembayaran}`}>{transaction.status_pembayaran.replace('_', ' ').toUpperCase()}</span></p>
                                    <p>Status Pengiriman: {transaction.status_pengiriman.replace('_', ' ').toUpperCase()}</p>
                                    
                                    {transaction.bukti_pembayaran ? (
                                        <div className="payment-proof-section">
                                            <p>Bukti Pembayaran:</p>
                                            <a href={`http://127.0.0.1:8000${transaction.bukti_pembayaran}`} target="_blank" rel="noopener noreferrer">
                                                <img src={`http://127.0.0.1:8000${transaction.bukti_pembayaran}`} alt="Bukti Pembayaran" className="proof-image" />
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="no-proof">Belum ada bukti pembayaran diunggah.</p>
                                    )}

                                    <div className="item-list-preview">
                                        <h5>Item dibeli:</h5>
                                        <ul>
                                            {transaction.detailTransaksiPembelian?.map(detail => (
                                                <li key={detail.id_detail_transaksi_pembelian}>
                                                    {detail.barang?.nama_barang || 'Barang Tidak Dikenal'} ({detail.jumlah_barang_pembelian}x)
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="card-actions">
                                    <button
                                        className="verify-btn success"
                                        onClick={() => handleVerifyPayment(transaction.id_pembelian, true)}
                                        disabled={verifyingId === transaction.id_pembelian}
                                    >
                                        {verifyingId === transaction.id_pembelian ? 'Memvalidasi...' : 'Validasi'}
                                    </button>
                                    <button
                                        className="verify-btn danger"
                                        onClick={() => handleVerifyPayment(transaction.id_pembelian, false)}
                                        disabled={verifyingId === transaction.id_pembelian}
                                    >
                                        {verifyingId === transaction.id_pembelian ? 'Menolak...' : 'Tolak'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {/* Pagination */}
                <div className="pagination">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => paginate(page)} className={currentPage === page ? 'active' : ''}>{page}</button>
                    ))}
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                </div>
            </div>
        </div>
    );
};

export default PaymentVerification;