// src\JSX\Login\Pembeli\Checkout.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import "./checkout.css";

const Checkout = () => {
    const [cart, setCart] = useState(null);
    const [pembeliProfile, setPembeliProfile] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [deliveryMethod, setDeliveryMethod] = useState('kurir');
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    const navigate = useNavigate();

    const ONGKIR_GRATIS_THRESHOLD = 1500000;
    const ONGKIR_HARGA = 100000;
    const POIN_RATE_RUPIAH = 100; // 100 poin = Rp 10.000, so 1 point = Rp 100
    const POIN_PER_RUPIAH = 10000; // 1 poin setiap Rp 10.000
    const BONUS_POIN_THRESHOLD = 500000;
    const BONUS_POIN_PERCENTAGE = 0.20;

    const handleLogout = () => {
        localStorage.clear();
        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const pembeliId = localStorage.getItem("id_pembeli");
        const userRole = localStorage.getItem("userRole");

        if (!token || userRole !== 'pembeli') {
            navigate("/generalLogin");
            toast.error("Anda harus login sebagai pembeli untuk melanjutkan.");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [cartRes, profileRes, addressesRes] = await Promise.all([
                    axios.get("http://127.0.0.1:8000/api/cart", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://127.0.0.1:8000/api/pembeli/${pembeliId}`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("http://127.0.0.1:8000/api/alamat", { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (!cartRes.data || !cartRes.data.items || cartRes.data.items.length === 0) {
                    toast.error("Keranjang Anda kosong, tidak dapat melanjutkan checkout.");
                    navigate("/cart");
                    return;
                }

                setCart(cartRes.data);
                setPembeliProfile(profileRes.data);
                setAddresses(Array.isArray(addressesRes.data) ? addressesRes.data : addressesRes.data.data);
                
                if (Array.isArray(addressesRes.data) && addressesRes.data.length > 0) {
                    setSelectedAddressId(addressesRes.data[0].id_alamat.toString());
                } else if (!Array.isArray(addressesRes.data) && addressesRes.data.data && addressesRes.data.data.length > 0) {
                    setSelectedAddressId(addressesRes.data.data[0].id_alamat.toString());
                }

            } catch (err) {
                console.error("Error fetching checkout data:", err.response?.data || err.message);
                setError("Gagal memuat data checkout.");
                if (err.response?.status === 401) handleLogout();
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const totalItemsPrice = cart?.items.reduce((sum, item) => sum + (item.quantity * (item.barang?.harga_barang || 0)), 0) || 0;
    // --- MODIFIKASI DIMULAI DI SINI ---
    const shippingCost = deliveryMethod === 'ambil_sendiri' ? 0 : (totalItemsPrice >= ONGKIR_GRATIS_THRESHOLD ? 0 : ONGKIR_HARGA);
    // --- MODIFIKASI BERAKHIR DI SINI ---
    const pointsDiscount = (Math.floor(pointsToRedeem / POIN_RATE_RUPIAH)) * 10000;
    const totalPayment = totalItemsPrice + shippingCost - pointsDiscount;
    const pointsEarned = Math.floor(totalItemsPrice / POIN_PER_RUPIAH);
    const bonusPoints = totalItemsPrice > BONUS_POIN_THRESHOLD ? Math.floor(pointsEarned * BONUS_POIN_PERCENTAGE) : 0;
    const finalPointsEarned = pointsEarned + bonusPoints;

    const handleCheckout = async () => {
        const token = localStorage.getItem("authToken");
        const pembeliId = localStorage.getItem("id_pembeli");

        if (!pembeliId || !cart || !cart.items || cart.items.length === 0) {
            toast.error("Keranjang kosong atau data pembeli tidak ditemukan.");
            return;
        }
        if (deliveryMethod === 'kurir' && (!selectedAddressId || addresses.length === 0)) {
            toast.error("Mohon pilih alamat pengiriman atau tambahkan alamat baru.");
            return;
        }

        const selectedAddress = addresses.find(addr => addr.id_alamat.toString() === selectedAddressId);
        if (deliveryMethod === 'kurir' && !selectedAddress) {
            toast.error("Alamat pengiriman tidak valid.");
            return;
        }
        
        if (pointsToRedeem > (pembeliProfile?.poin_loyalitas || 0)) {
            toast.error("Poin yang ditukar melebihi poin yang Anda miliki.");
            return;
        }
        if (pointsToRedeem % 100 !== 0) {
             toast.error("Poin yang ditukar harus kelipatan 100.");
             return;
        }

        setLoading(true);

        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const nomorTransaksiNota = `${year}${month}${day}.${hours}${minutes}${seconds}.${randomNum}`;

        const payload = {
            nomor_transaksi_nota: nomorTransaksiNota,
            tanggal_pembelian: new Date().toISOString().split('T')[0],
            jenis_pengiriman: deliveryMethod,
            total_harga: totalItemsPrice,
            biaya_ongkir: shippingCost, // shippingCost sudah diperbarui
            tukar_poin_potongan: pointsToRedeem,
            total_bayar: totalPayment,
            poin_pembelian: finalPointsEarned,
            alamat_pembeli: deliveryMethod === 'kurir' ? selectedAddress.alamat_lengkap : 'Ambil Sendiri',
            pembeli_id_pembelian: pembeliId,
            status_pembayaran: 'menunggu_pembayaran',
            
            items: cart.items.map(item => ({
                barang_id_detail_pembelian: item.barang_id,
                jumlah_barang_pembelian: item.quantity,
            }))
        };

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/transaksi-pembelian", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const newTransaction = response.data.data;
            toast.success("Pesanan Anda berhasil dibuat! Mohon segera lakukan pembayaran.");
            
            // Set waktu berakhir countdown di localStorage
            const endTime = Date.now() + 60 * 1000; // 60 detik dari sekarang
            localStorage.setItem(`paymentEndTime_${newTransaction.id_pembelian}`, new Date(endTime).toISOString());

            // Redirect ke halaman pembayaran dengan membawa ID transaksi
            navigate('/payment', { state: { transactionId: newTransaction.id_pembelian } });

        } catch (err) {
            console.error("Error during checkout:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Gagal memproses checkout.');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-state">Memuat halaman Checkout...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="empty-cart-message">
                Keranjang Anda kosong. Tidak dapat melanjutkan checkout. <Link to="/shop-pembeli">Mulai belanja!</Link>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <nav className="navbar">
                <div className="logo">
                    <img src="/Logo.png" alt="Reusemart Logo" />
                    <span>REUSEMART</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/shop-pembeli">Shop</Link></li>
                    <li><Link to="/pembeli/dashboard">Profil</Link></li>
                    <li><Link to="/cart">Keranjang</Link></li>
                    <li><Link to="/pembeli/history">History</Link></li>
                    <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                </ul>
                <div className="nav-icons">
                    <i className="fas fa-search"></i>
                </div>
            </nav>

            <div className="checkout-container">
                <h2>Checkout</h2>

                <div className="checkout-section">
                    <h3>Item di Keranjang</h3>
                    <div className="cart-items-summary">
                        {cart.items.map(item => (
                            <div className="summary-item" key={item.id_cart_item}>
                                <img src={`http://127.0.0.1:8000/images/${item.barang?.image}`} alt={item.barang?.nama_barang || 'Barang'} />
                                <div>
                                    <h4>{item.barang?.nama_barang || 'Barang Tidak Dikenal'}</h4>
                                    <p>Kuantitas: {item.quantity}</p>
                                    <p>Rp {Number(item.barang?.harga_barang || 0).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="checkout-section">
                    <h3>Detail Pengiriman</h3>
                    <div className="form-group">
                        <label>Metode Pengiriman:</label>
                        <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                            <option value="kurir">Kurir</option>
                            <option value="ambil_sendiri">Ambil Sendiri</option>
                        </select>
                    </div>

                    {deliveryMethod === 'kurir' && (
                        <div className="form-group">
                            <label>Pilih Alamat:</label>
                            <select value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)} required>
                                {addresses.length > 0 ? (
                                    addresses.map(addr => (
                                        <option key={addr.id_alamat} value={addr.id_alamat}>
                                            {addr.alamat_lengkap}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">Tidak ada alamat. Mohon tambahkan di Profil.</option>
                                )}
                            </select>
                            {addresses.length === 0 && <p className="warning-text">Anda belum memiliki alamat tersimpan. Mohon tambahkan alamat di halaman Profil Anda.</p>}
                        </div>
                    )}
                </div>

                <div className="checkout-section">
                    <h3>Ringkasan Pembayaran</h3>
                    <div className="summary-details">
                        <div className="summary-row"><span>Harga Barang:</span> <span>Rp {Number(totalItemsPrice).toLocaleString('id-ID')}</span></div>
                        <div className="summary-row"><span>Biaya Ongkir:</span> <span>Rp {Number(shippingCost).toLocaleString('id-ID')}</span></div>
                        
                        <div className="form-group">
                            <label htmlFor="points">Poin Loyalitas Anda: {pembeliProfile?.poin_loyalitas || 0} Poin</label>
                            <input
                                type="number"
                                id="points"
                                placeholder="Poin yang ingin ditukar (kelipatan 100)"
                                value={pointsToRedeem}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    if (value > (pembeliProfile?.poin_loyalitas || 0)) {
                                        toast.error("Poin yang ditukar melebihi poin yang Anda miliki.");
                                        setPointsToRedeem(pembeliProfile?.poin_loyalitas || 0);
                                    } else {
                                        setPointsToRedeem(value);
                                    }
                                }}
                                min="0"
                                max={pembeliProfile?.poin_loyalitas || 0}
                                step="100"
                            />
                            {pointsToRedeem > 0 && <p className="discount-info">Potongan Poin: Rp {Number(pointsDiscount).toLocaleString('id-ID')}</p>}
                        </div>

                        <div className="summary-row total">
                            <span>Total Bayar:</span> <span>Rp {Number(totalPayment).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="summary-row earned-points">
                            <span>Poin yang Didapat:</span> <span>{finalPointsEarned} Poin</span>
                        </div>
                    </div>
                </div>

                <button className="checkout-btn" onClick={handleCheckout} disabled={!cart || cart.items.length === 0 || loading || (deliveryMethod === 'kurir' && addresses.length === 0)}>
                    {loading ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
                </button>
            </div>
        </div>
    );
};

export default Checkout;