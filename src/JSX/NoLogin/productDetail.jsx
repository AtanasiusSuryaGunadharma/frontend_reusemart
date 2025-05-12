/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./productDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <img src="/loading-spinner.gif" alt="Loading..." />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!product) {
    return <p className="error-message">Produk tidak ditemukan.</p>;
  }

  return (
    <div className="product-detail-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>
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
            {/* Update path to access image correctly */}
            <img
              src={`http://127.0.0.1:8000/images/${product.image}`} // Adjust the image URL
              alt={product.nama_barang || "Product Image"}
              className="main-image"
            />
            <div className="thumbnail-images">
              {(product.images || []).map((image, index) => (
                <img key={index} src={image} alt="thumbnail" className="thumbnail" />
              ))}
            </div>
          </div>
          <div className="product-info">
            <h2>{product.nama_barang || "No Name"}</h2>
            <p className="price">Rp {Number(product.harga_barang || 0).toLocaleString()}</p>
            <p className="description">{product.deskripsi_barang || "Tidak ada deskripsi"}</p>
            <div className="rating">
              <span>{product.berat_barang || 0} kg</span>
            </div>
            <div className="add-to-cart">
              <button className="add-to-cart-btn">Buy</button>
            </div>
            <div className="details">
              <p><strong>Category:</strong> {product.kategori_barang?.nama_kategori || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
