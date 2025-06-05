// src\JSX\Login\Pembeli\productDetailPembeli.jsx
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { toast } from 'react-toastify'; // Import toast
import "./productDetailPembeli.css"; // <-- Import CSS yang sesuai

const ProductDetailPembeli = () => { // <-- Ganti nama komponen
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const sliderRef = useRef(null);
    const navigate = useNavigate(); // <-- Tambahkan useNavigate

    const [cartItems, setCartItems] = useState([]); // <-- State BARU: untuk menyimpan item di keranjang

    // Handler Logout (sama seperti di shopPembeli.jsx)
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

    // Fungsi fetch current cart items (sama seperti di shopPembeli.jsx)
    const fetchCurrentCartItems = async (token) => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/cart", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data && response.data.items && Array.isArray(response.data.items)) {
                const itemIdsInCart = response.data.items.map(item => item.barang_id);
                setCartItems(itemIdsInCart);
            } else {
                setCartItems([]);
            }
        } catch (err) {
            console.error("Error fetching current cart items:", err.response?.data || err.message);
            if (err.response?.status === 401) handleLogout();
        }
    };


    // useEffect untuk memuat data produk dan item keranjang saat komponen dimuat
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userRole = localStorage.getItem("userRole");

        // Redirect jika tidak login atau bukan pembeli
        if (!token || userRole !== 'pembeli') {
            navigate("/generalLogin");
            toast.error("Anda harus login sebagai pembeli untuk melihat detail produk.");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const productResponse = await axios.get(`http://127.0.0.1:8000/api/barang/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }, // Sertakan token
                });
                setProduct(productResponse.data);

                await fetchCurrentCartItems(token); // Fetch item keranjang

            } catch (err) {
                console.error("Error fetching product details or cart items:", err);
                setError("Gagal mengambil detail produk atau informasi keranjang.");
                if (err.response?.status === 401) handleLogout();
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]); // id sebagai dependency untuk fetch ulang jika ID produk berubah


    // Handler untuk Add to Cart (sama seperti di shopPembeli.jsx)
    const handleAddToCart = async () => { // Tidak perlu parameter product karena sudah ada di state
        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.error("Anda harus login untuk menambahkan barang ke keranjang.");
            navigate("/login/pembeli");
            return;
        }
        if (!product) { // Pastikan produk sudah dimuat
            toast.error("Detail produk belum dimuat.");
            return;
        }

        // Cek apakah barang sudah ada di keranjang
        if (cartItems.includes(product.id_barang)) {
            toast.warn(`${product.nama_barang} sudah ada di keranjang Anda.`);
            return;
        }

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/cart/add", {
                barang_id: product.id_barang,
                quantity: 1, // Kuantitas selalu 1
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

    // Handler BARU untuk Beli Sekarang
    const handleBuyNow = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.error("Anda harus login untuk melanjutkan pembelian.");
            navigate("/login/pembeli");
            return;
        }
        if (!product) {
            toast.error("Detail produk belum dimuat.");
            return;
        }

        try {
            // Coba tambahkan produk ke keranjang terlebih dahulu
            const response = await axios.post("http://127.0.0.1:8000/api/cart/add", {
                barang_id: product.id_barang,
                quantity: 1,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            toast.success(response.data.message || `${product.nama_barang} berhasil ditambahkan ke keranjang dan akan diarahkan ke checkout!`);
            
            // Perbarui daftar item keranjang di state
            setCartItems(prevItems => [...prevItems, product.id_barang]);

            // Langsung arahkan ke halaman checkout
            navigate("/checkout");

        } catch (err) {
            console.error("Error during 'Buy Now':", err.response?.data || err.message);
            // Jika produk sudah di keranjang, mungkin tidak perlu toast error, langsung redirect
            if (err.response?.status === 409) { // Konflik, kemungkinan barang sudah ada di keranjang
                toast.info(`${product.nama_barang} sudah ada di keranjang. Mengarahkan Anda ke checkout.`);
                navigate("/checkout");
            } else {
                toast.error(err.response?.data?.message || `Gagal menambahkan ${product.nama_barang} ke keranjang untuk checkout.`);
            }
        }
    };

    const getImageList = () => {
        const images = [];
        if (product?.image) {
            images.push(`http://127.0.0.1:8000/images/${product.image}`);
        }
        if (product?.image2) {
            images.push(`http://127.0.0.1:8000/images/${product.image2}`);
        }
        return images.length > 0 ? images : ["/default-image.jpg"];
    };

    const handleThumbnailClick = (index) => {
        if (sliderRef.current) {
            sliderRef.current.slickGoTo(index);
        }
    };

    const settings = {
        dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1,
        autoplay: true, autoplaySpeed: 3000, arrows: true,
        appendDots: (dots) => ( <div> <ul style={{ margin: "0px" }}> {dots} </ul> </div> ),
        customPaging: (i) => <button>{i + 1}</button>,
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Tidak ada garansi";
        return dateString.split("T")[0];
    };

    if (loading) {
        return <img src="/loading-spinner.gif" alt="Loading..." className="loading-spinner" />;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (!product) {
        return <p className="error-message">Produk tidak ditemukan.</p>;
    }

    const imageList = getImageList();
    const isProductInCart = cartItems.includes(product.id_barang); // <-- Cek status barang di keranjang

    return (
        <div className="product-detail-page">
            {/* Navbar (sesuaikan dengan ShopPembeli.jsx) */}
            <nav className="navbar">
                <div className="logo">
                    <img src="/Logo.png" alt="Reusemart Logo" />
                    <span>REUSEMART</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/shop-pembeli">Shop</Link></li>
                    <li><Link to="/pembeli/dashboard">Profil</Link></li> {/* Link ke dashboard (sekarang profil) */}
                    <li><Link to="/cart">Keranjang</Link></li>
                    <li><Link to="/pembeli/history">History</Link></li>
                    <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                </ul>
                <div className="nav-icons">
                    <i className="fas fa-search"></i>
                </div>
            </nav>

            {/* Product Details */}
            <div className="product-detail-container">
                <div className="product-detail">
                    <div className="product-images">
                        <Slider {...settings} ref={sliderRef}>
                            {imageList.map((image, index) => (
                                <div key={index}>
                                    <img src={image} alt={product.nama_barang || "Product Image"} className="main-image" />
                                </div>
                            ))}
                        </Slider>
                        <div className="thumbnail-images">
                            {imageList.map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="thumbnail"
                                    onClick={() => handleThumbnailClick(index)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="product-info">
                        <h2>{product.nama_barang || "No Name"}</h2>
                        <p className="price">Rp {Number(product.harga_barang || 0).toLocaleString('id-ID')}</p>
                        <p className="description">{product.deskripsi_barang || "Tidak ada deskripsi"}</p>
                        <p className="description">Garansi: {formatDate(product.tanggal_garansi)}</p>
                        <div className="rating">
                            <span>{product.berat_barang || 0} kg</span>
                        </div>
                        <div className="penitip-info">
                            <p><strong>Penitip:</strong> {product.penitip?.nama_penitip || "N/A"}</p>
                            <p>
                                <strong>Rating Penitip:</strong>{" "}
                                {product.average_penitip_rating ? (
                                    <>
                                        {product.average_penitip_rating} ★
                                    </>
                                ) : (
                                    "Belum ada rating"
                                )}
                            </p>
                        </div>
                        <div className="details">
                            <p>
                                <strong>Category:</strong>{" "}
                                {product.kategori_barang?.nama_kategori || "N/A"}
                            </p>
                        </div>
                        <div className="product-actions"> {/* Container untuk tombol */}
                            {/* Tombol Add to Cart: di-disable jika barang sudah ada di keranjang */}
                            <button
                                className="add-to-cart-btn"
                                onClick={handleAddToCart} // Panggil tanpa parameter, gunakan product dari state
                                disabled={isProductInCart} // <-- Logika disable BARU
                            >
                                {isProductInCart ? 'Sudah di Keranjang' : 'Add to Cart'} {/* <-- Teks tombol BARU */}
                            </button>
                            {/* Tombol Beli Sekarang */}
                            <button
                                className="buy-now-btn" // Gunakan class baru untuk styling
                                onClick={handleBuyNow}
                            >
                                Beli Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPembeli; // <-- Export komponen dengan nama baru