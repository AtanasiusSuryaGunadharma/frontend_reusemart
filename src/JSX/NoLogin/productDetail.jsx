import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; // Impor CSS Slick
import "slick-carousel/slick/slick-theme.css"; // Impor tema Slick
import "./productDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null); // Referensi untuk mengontrol Slider

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`http://127.0.0.1:8000/api/barang/${id}`)
      .then((response) => {
        setProduct(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError("Gagal mengambil detail produk. Silakan coba lagi.");
        setLoading(false);
      });
  }, [id]);

  // Daftar gambar untuk Slider dan thumbnail
  const getImageList = () => {
    const images = [];
    if (product?.image) {
      images.push(`http://127.0.0.1:8000/images/${product.image}`);
    }
    if (product?.image2) {
      images.push(`http://127.0.0.1:8000/images/${product.image2}`);
    }
    return images.length > 0 ? images : ["/default-image.jpg"]; // Fallback jika tidak ada gambar
  };

  // Fungsi untuk pindah ke slide tertentu saat thumbnail diklik
  const handleThumbnailClick = (index) => {
    if (sliderRef.current) {
      sliderRef.current.slickGoTo(index); // Pindah ke slide yang sesuai
    }
  };

  // Pengaturan untuk Slider
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    appendDots: (dots) => (
      <div>
        <ul style={{ margin: "0px" }}> {dots} </ul>
      </div>
    ),
    customPaging: (i) => <button>{i + 1}</button>,
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

  return (
    <div className="product-detail-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART</span>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/shop">Shop</Link>
          </li>
        </ul>
        <div className="nav-icons">
          <i className="fas fa-user"></i>
          <i className="fas fa-heart"></i>
          <i className="fas fa-shopping-cart"></i>
        </div>
      </nav>

      {/* Product Details */}
      <div className="product-detail-container">
        <div className="product-detail">
          <div className="product-images">
            {/* Slider untuk gambar utama */}
            <Slider {...settings} ref={sliderRef}>
              {imageList.map((image, index) => (
                <div key={index}>
                  <img
                    src={image}
                    alt={product.nama_barang || "Product Image"}
                    className="main-image"
                  />
                </div>
              ))}
            </Slider>
            {/* Thumbnail */}
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
            <p className="price">
              Rp {Number(product.harga_barang || 0).toLocaleString()}
            </p>
            <p className="description">
              {product.deskripsi_barang || "Tidak ada deskripsi"}
            </p>
            <p className="description">
              Garansi: {product.tanggal_garansi || "Tidak ada garansi"}
            </p>
            <div className="rating">
              <span>{product.berat_barang || 0} kg</span>
            </div>
            <div className="add-to-cart">
              <button className="add-to-cart-btn">Buy</button>
            </div>
            <div className="details">
              <p>
                <strong>Category:</strong>{" "}
                {product.kategori_barang?.nama_kategori || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;