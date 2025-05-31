import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import "./paymentPage.css"; // Pastikan CSS ini ada

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [transactionDetail, setTransactionDetail] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [paymentProof, setPaymentProof] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    const transactionId = location.state?.transactionId;

    const handleLogout = () => {
        localStorage.clear();
        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    const fetchTransactionDetails = async (id, token) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/transaksi-pembelian/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (err) {
            console.error("Error fetching transaction details:", err.response?.data || err.message);
            throw err;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userRole = localStorage.getItem("userRole");

        if (!token || userRole !== 'pembeli') {
            navigate("/generalLogin");
            toast.error("Anda harus login sebagai pembeli.");
            return;
        }

        if (!transactionId) {
            toast.error("ID Transaksi tidak ditemukan. Silakan ulangi checkout.");
            navigate('/cart');
            return;
        }

        const loadTransactionAndCountdown = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedTransaction = await fetchTransactionDetails(transactionId, token);
                setTransactionDetail(fetchedTransaction);

                if (fetchedTransaction.status_pembayaran !== 'menunggu_pembayaran') {
                    toast.info(`Transaksi ini sudah berstatus: ${fetchedTransaction.status_pembayaran}.`);
                    localStorage.removeItem(`paymentEndTime_${transactionId}`);
                    navigate('/pembeli/history');
                    return;
                }

                const storedEndTime = localStorage.getItem(`paymentEndTime_${transactionId}`);
                const initialDuration = 60 * 15; // 15 menit dalam detik, bisa disesuaikan
                let calculatedRemainingTime = 0;

                if (storedEndTime) {
                    const endTimeMs = new Date(storedEndTime).getTime();
                    calculatedRemainingTime = Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000));
                    setCountdown(calculatedRemainingTime);
                    
                    if (calculatedRemainingTime === 0) {
                        handleCancelTransaction(transactionId, true);
                    }
                } else {
                    const endTime = Date.now() + initialDuration * 1000;
                    localStorage.setItem(`paymentEndTime_${transactionId}`, new Date(endTime).toISOString());
                    setCountdown(initialDuration);
                }

            } catch (err) {
                setError("Gagal memuat detail transaksi.");
                if (err.response?.status === 401) handleLogout();
                else if (err.response?.status === 404) toast.error("Transaksi tidak ditemukan.");
                else if (err.response?.status === 403) toast.error("Anda tidak berhak melihat transaksi ini.");
                navigate('/cart');
            } finally {
                setLoading(false);
            }
        };

        loadTransactionAndCountdown();

    }, [transactionId, navigate]);


    useEffect(() => {
        let timer;
        if (transactionDetail?.status_pembayaran === 'menunggu_pembayaran' && countdown > 0 && !uploading) {
            timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0 && transactionDetail?.status_pembayaran === 'menunggu_pembayaran' && !uploading) {
            handleCancelTransaction(transactionDetail.id_pembelian, true);
        }
        return () => clearTimeout(timer);
    }, [countdown, transactionDetail, uploading]);

    const handleFileChange = (e) => {
        setPaymentProof(e.target.files[0]);
    };

    const handleUploadPaymentProof = async (e) => {
        e.preventDefault();
        if (!paymentProof) {
            toast.error("Mohon pilih file bukti pembayaran.");
            return;
        }
        if (!transactionDetail || transactionDetail.status_pembayaran !== 'menunggu_pembayaran') {
            toast.error("Transaksi tidak dalam status menunggu pembayaran.");
            return;
        }
        if (countdown === 0) {
            toast.error("Waktu pembayaran telah habis. Transaksi ini dibatalkan.");
            return;
        }

        setUploading(true);
        const token = localStorage.getItem("authToken");
        const formData = new FormData();
        formData.append('bukti_pembayaran', paymentProof);
        formData.append('tanggal_pembayaran', new Date().toISOString().split('T')[0]);
        formData.append('_method', 'POST');

        try {
            const response = await axios.post(`http://127.0.0.1:8000/api/transaksi-pembelian/${transactionDetail.id_pembelian}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success(response.data.message || "Bukti pembayaran berhasil diunggah. Menunggu verifikasi CS.");
            setTransactionDetail(response.data.data);
            localStorage.removeItem(`paymentEndTime_${transactionDetail.id_pembelian}`);
            navigate('/pembeli/history');
        } catch (err) {
            console.error("Error uploading payment proof:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal mengunggah bukti pembayaran.");
        } finally {
            setUploading(false);
        }
    };

    const handleCancelTransaction = async (transId, isAutomatic = false) => {
        const token = localStorage.getItem("authToken");
        if (!transId) return;

        setUploading(true);
        try {
            const response = await axios.put(`http://127.0.0.1:8000/api/transaksi-pembelian/${transId}`, { action: 'cancel_transaction' }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (isAutomatic) {
                toast.error("Waktu pembayaran habis. Transaksi dibatalkan secara otomatis.");
            } else {
                toast.info("Transaksi berhasil dibatalkan.");
            }
            setTransactionDetail(response.data.data);
            localStorage.removeItem(`paymentEndTime_${transId}`);
            navigate('/pembeli/history');
        } catch (err) {
            console.error("Error canceling transaction:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal membatalkan transaksi.");
        } finally {
            setUploading(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="payment-loading-state">
                <div className="spinner"></div> {/* Tambahkan spinner loading */}
                Memuat detail pembayaran...
            </div>
        );
    }

    if (error) {
        return <div className="payment-error-state">Error: {error}</div>;
    }

    if (!transactionDetail) {
        return <div className="payment-error-state">Detail transaksi tidak tersedia setelah dimuat.</div>;
    }

    const isPaymentPending = transactionDetail.status_pembayaran === 'menunggu_pembayaran';
    const isPaymentDone = ['dibayar', 'valid'].includes(transactionDetail.status_pembayaran);
    const isPaymentCancelled = ['tidak_valid', 'dibatalkan'].includes(transactionDetail.status_pembayaran);

    return (
        <div className="payment-page">
            <nav className="payment-navbar">
                <div className="payment-logo">
                    <img src="/Logo.png" alt="Reusemart Logo" />
                    <span>REUSEMART</span>
                </div>
                <ul className="payment-nav-links">
                    <li><Link to="/shop-pembeli">Shop</Link></li>
                    <li><Link to="/pembeli/dashboard">Profil</Link></li>
                    <li><Link to="/cart">Keranjang</Link></li>
                    <li><Link to="/pembeli/history">History</Link></li>
                    <li><button onClick={handleLogout} className="payment-logout-btn">Logout</button></li>
                </ul>
            </nav>

            <div className="payment-container">
                <h2 className="payment-title">Detail Pembayaran Transaksi</h2>

                <div className="payment-card">
                    <div className="payment-header">
                        <h3>Status Transaksi Anda</h3>
                        <span className={`payment-status-badge status-${transactionDetail.status_pembayaran}`}>
                            {transactionDetail.status_pembayaran.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>

                    {isPaymentPending && (
                        <div className="payment-countdown-section">
                            <h4>Batas Waktu Pembayaran Tersisa:</h4>
                            <div className={`countdown-timer ${countdown <= 60 ? 'warning' : ''} ${countdown <= 10 ? 'critical' : ''}`}>
                                {countdown > 0 ? formatTime(countdown) : "WAKTU HABIS!"}
                            </div>
                            {countdown <= 0 && <p className="text-danger mt-2">Waktu pembayaran telah habis. Transaksi ini akan dibatalkan.</p>}
                        </div>
                    )}

                    <div className="payment-info-section">
                        <div className="info-row">
                            <span className="info-label">Nomor Transaksi:</span>
                            <span className="info-value"><strong>{transactionDetail.nomor_transaksi_nota}</strong></span>
                        </div>
                        <div className="info-row total-amount">
                            <span className="info-label">Total Pembayaran:</span>
                            <span className="info-value"><strong>Rp {Number(transactionDetail.total_bayar).toLocaleString('id-ID')}</strong></span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Metode Pengiriman:</span>
                            <span className="info-value">{transactionDetail.jenis_pengiriman === 'kurir' ? `Kurir (${transactionDetail.alamat_pembeli})` : 'Ambil Sendiri'}</span>
                        </div>
                        {transactionDetail.tanggal_pembayaran && (
                             <div className="info-row">
                                 <span className="info-label">Tanggal Pembayaran:</span>
                                 <span className="info-value">{new Date(transactionDetail.tanggal_pembayaran).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                             </div>
                        )}
                    </div>

                    {isPaymentPending && countdown > 0 && (
                        <div className="payment-upload-section">
                            <h4>Unggah Bukti Pembayaran</h4>
                            <p className="text-muted">Pastikan gambar bukti pembayaran jelas dan terbaca.</p>
                            <form onSubmit={handleUploadPaymentProof} className="payment-form-upload">
                                <div className="form-group-file">
                                    <label htmlFor="paymentProof" className="file-input-label">
                                        {paymentProof ? paymentProof.name : "Pilih File Bukti Pembayaran"}
                                    </label>
                                    <input
                                        type="file"
                                        id="paymentProof"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        required
                                        disabled={uploading}
                                        className="hidden-file-input"
                                    />
                                </div>
                                <div className="button-group">
                                    <button type="submit" className="btn-primary" disabled={!paymentProof || uploading}>
                                        {uploading ? "Mengunggah..." : "Unggah Bukti Pembayaran"}
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => handleCancelTransaction(transactionDetail.id_pembelian)} disabled={uploading}>
                                        Batalkan Transaksi
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {isPaymentDone && (
                        <div className="payment-status-message success-message">
                            <p>✅ Pembayaran Anda telah {transactionDetail.status_pembayaran === 'valid' ? 'divalidasi' : 'diunggah dan sedang menunggu verifikasi'}.</p>
                            <p>Silakan pantau status transaksi Anda di <Link to="/pembeli/history">Halaman Riwayat Transaksi</Link>.</p>
                        </div>
                    )}

                    {isPaymentCancelled && (
                        <div className="payment-status-message error-message">
                            <p>❌ Transaksi Anda telah {transactionDetail.status_pembayaran === 'tidak_valid' ? 'dibatalkan karena bukti pembayaran tidak valid' : 'dibatalkan'}.</p>
                            <p>Poin loyalitas yang Anda tukar telah dikembalikan.</p>
                        </div>
                    )}
                    
                    <div className="back-to-shop-section">
                        <Link to="/shop-pembeli" className="btn-link">Kembali ke Shop</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;