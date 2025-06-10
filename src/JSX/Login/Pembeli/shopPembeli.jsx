/* eslint-disable no-unused-vars */
// src\JSX\Login\Pembeli\shopPembeli.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import "./shopPembeli.css";

const ShopPembeli = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [cartItems, setCartItems] = useState([]); // <-- State BARU: untuk menyimpan item yang sudah ada di keranjang

    const navigate = useNavigate();

    // Handler Logout (tetap sama)
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
        localStorage.removeItem("id_pegawai"); localStorage.removeItem("name"); localStorage.removeItem("jabatan");
        localStorage.removeItem("id_organisasi"); localStorage.removeItem("nama_organisasi"); localStorage.removeItem("email_organisasi");
        localStorage.removeItem("id_penitip"); localStorage.removeItem("email_penitip"); localStorage.removeItem("no_telepon_penitip");
        localStorage.removeItem("nama_penitip");

        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    // Fungsi fetch produk (tetap sama)
    const fetchProducts = async (token, search = '', statusFilter = 'aktif') => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/barang", {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    search: search,
                    status: statusFilter
                }
            });
            console.log("API Products Response (filtered by status 'aktif'):", response.data);
            if (Array.isArray(response.data)) {
                setProducts(response.data);
                setFilteredProducts(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                setProducts(response.data.data);
                setFilteredProducts(response.data.data);
            } else {
                setProducts([]); setError("Data produk tidak dalam format yang diharapkan.");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            setError("Gagal mengambil data produk. Silakan coba lagi.");
            if (error.response?.status === 401) handleLogout();
        }
    };

    // Fungsi fetch kategori (tetap sama)
    const fetchCategories = async () => { /* ... */ };

    // Fungsi BARU: fetch isi keranjang untuk mendapatkan item_id
    const fetchCurrentCartItems = async (token) => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/cart", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Current Cart Items:", response.data);
            // Simpan hanya ID barang yang ada di keranjang untuk cek cepat
            if (response.data && response.data.items && Array.isArray(response.data.items)) {
                const itemIdsInCart = response.data.items.map(item => item.barang_id);
                setCartItems(itemIdsInCart);
            } else {
                setCartItems([]); // Jika tidak ada item atau format tidak sesuai
            }
        } catch (err) {
            console.error("Error fetching current cart items:", err.response?.data || err.message);
            // Jangan setError global, ini hanya untuk cek keranjang, bisa jadi keranjang kosong bukan error
            if (err.response?.status === 401) handleLogout();
        }
    };


    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userRole = localStorage.getItem("userRole");

        if (!token || userRole !== 'pembeli') {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini. Silakan login sebagai pembeli.");
            return;
        }

        const loadData = async () => {
            setLoading(true);
            setError(null);
            await Promise.all([
                fetchProducts(token, '', 'aktif'), // Fetch semua produk aktif
                fetchCategories(),
                fetchCurrentCartItems(token) // <-- Panggil fungsi BARU ini
            ]);
            setLoading(false);
        };
        loadData();
    }, [navigate]);

    // Fungsi untuk menangani pencarian produk (tetap sama)
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        const token = localStorage.getItem("authToken");
        if(token) {
            fetchProducts(token, query, 'aktif');
        }
    };

    const handleCategoryChange = (e) => {
        const category = e.target.value;
        setSelectedCategory(category);
        filterProducts(searchQuery, category);
    };

    // Fungsi untuk memfilter produk berdasarkan pencarian dan kategori (dilakukan di frontend)
    const filterProducts = (query, category) => {
        let tempFiltered = products;
        if (query) {
            tempFiltered = tempFiltered.filter(product =>
                product.nama_barang.toLowerCase().includes(query.toLowerCase())
            );
        }
        if (category) {
            tempFiltered = tempFiltered.filter(product =>
                product.id_kategoribarang === parseInt(category)
            );
        }
        setFilteredProducts(tempFiltered);
    };


    // Handler untuk Add to Cart
    const handleAddToCart = async (product) => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.error("Anda harus login untuk menambahkan barang ke keranjang.");
            navigate("/login/pembeli");
            return;
        }

        // <-- LOGIKA BARU: Cek apakah barang sudah ada di keranjang
        if (cartItems.includes(product.id_barang)) {
            toast.warn(`${product.nama_barang} sudah ada di keranjang Anda.`);
            return; // Hentikan proses jika barang sudah ada
        }

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/cart/add", {
                barang_id: product.id_barang,
                quantity: 1,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(response.data.message || `${product.nama_barang} berhasil ditambahkan ke keranjang!`);
            
            // Perbarui daftar item keranjang di state setelah berhasil menambahkan
            setCartItems(prevItems => [...prevItems, product.id_barang]);

        } catch (err) {
            console.error("Error adding to cart:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || `Gagal menambahkan ${product.nama_barang} ke keranjang.`);
        }
    };


    if (loading) return <p>Loading products...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="shop-page">
            {/* Navbar (tetap sama) */}
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

            {/* Shop Container (tetap sama) */}
            <div className="shop-container">
                <h2>Daftar Produk</h2>

                {/* Search and Category Filter */}
                <div className="shop-filters">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Cari produk..."
                        className="search-input"
                    />
                    <select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="category-select"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((category) => (
                            <option key={category.id_kategori} value={category.id_kategori}>
                                {category.nama_kategori}
                            </option>
                        ))}
                    </select>
                </div>

                {filteredProducts.length === 0 ? (
                    <p>Tidak ada produk yang tersedia.</p>
                ) : (
                    <div className="product-grid">
                        {filteredProducts.map((product) => (
                            <div className="product-card" key={product.id_barang}>
                                <Link to={`/pembeli/barang/${product.id_barang}`} className="product-link">
                                    <img
                                        src={`http://127.0.0.1:8000/images/${product.image}`}
                                        alt={product.nama_barang || "Product Image"}
                                    />
                                    <div className="product-info">
                                        <h3>{product.nama_barang || "No Name"}</h3>
                                        <p>Rp {Number(product.harga_barang || 0).toLocaleString('id-ID')}</p>
                                    </div>
                                </Link>
                                {/* Tombol Add to Cart: di-disable jika barang sudah ada di keranjang */}
                                <button
                                    className="add-to-cart-btn"
                                    onClick={() => handleAddToCart(product)}
                                    disabled={cartItems.includes(product.id_barang)} // <-- Logika disable BARU
                                >
                                    {cartItems.includes(product.id_barang) ? 'Sudah di Keranjang' : 'Add to Cart'} {/* <-- Teks tombol BARU */}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopPembeli;