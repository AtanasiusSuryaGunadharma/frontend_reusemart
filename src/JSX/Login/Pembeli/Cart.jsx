// src\JSX\Login\Pembeli\Cart.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import "./cart.css";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    localStorage.removeItem("nama_penitip");

    navigate("/generalLogin");
    toast.info("Anda telah logout.");
  };

  // Fungsi untuk fetch isi keranjang (tetap sama)
  const fetchCart = async (token) => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched Cart:", response.data);
      setCart(response.data);
    } catch (err) {
      console.error("Error fetching cart:", err.response?.data || err.message);
      setError("Gagal memuat keranjang.");
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== 'pembeli') {
      navigate("/generalLogin");
      toast.error("Anda harus login sebagai pembeli untuk melihat keranjang.");
      return;
    }

    fetchCart(token);
  }, [navigate]);

  // Handler untuk menghapus item dari keranjang (tetap sama)
  const handleRemoveItem = async (itemId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus barang ini dari keranjang?")) return;
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.delete(`http://127.0.0.1:8000/api/cart/remove-item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message || "Barang berhasil dihapus dari keranjang.");
      await fetchCart(token); // Refresh keranjang
    } catch (err) {
      console.error("Error removing item:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Gagal menghapus barang dari keranjang.");
    }
  };

  if (loading) return <p>Memuat keranjang...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!cart || !cart.items) return <p>Keranjang tidak tersedia.</p>;

  // Hitung total harga berdasarkan item yang ada di keranjang (kuantitas selalu 1 di sini)
  const totalCartPrice = cart.items.reduce(
    (sum, item) => sum + (1 * (item.barang?.harga_barang || 0)),
    0
  );

  return (
    <div className="cart-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <img src="/Logo.png" alt="Reusemart Logo" />
          <span>REUSEMART</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/shop-pembeli">Shop</Link></li>
          <li><Link to="/pembeli/dashboard">Profil</Link></li>
          <li><Link to="/cart">Keranjang</Link></li> {/* Link ke halaman ini */}
          <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
        </ul>
        <div className="nav-icons">
          <i className="fas fa-search"></i>
        </div>
      </nav>

      {/* Konten Keranjang */}
      <div className="cart-container">
        <h2>Keranjang Belanja Anda</h2>

        {cart.items.length === 0 ? (
          <p className="empty-cart-message">
            Keranjang Anda kosong. Yuk, <Link to="/shop-pembeli">mulai belanja!</Link>
          </p>
        ) : (
          <div className="cart-items-list">
            {cart.items.map(item => (
              <div className="cart-item-card" key={item.id_cart_item}>
                <div className="item-info">
                  <img
                    src={`http://127.0.0.1:8000/images/${item.barang?.image}`}
                    alt={item.barang?.nama_barang || 'Barang'}
                    className="item-image"
                  />
                  <div className="item-details">
                    <h3>{item.barang?.nama_barang || 'Barang Tidak Dikenal'}</h3>
                    <p className="item-price">
                      Rp {Number(item.barang?.harga_barang || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="item-controls">
                  {/* Tombol quantity control dihapus */}
                  <button className="remove-item-btn" onClick={() => handleRemoveItem(item.id_cart_item)}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.items.length > 0 && (
          <div className="cart-summary">
            <div className="summary-row">
              <span>Total Harga:</span>
              <span>Rp {Number(totalCartPrice).toLocaleString('id-ID')}</span>
            </div>
            <button className="checkout-btn">Lanjutkan ke Pembayaran</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
