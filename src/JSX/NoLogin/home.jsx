/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./home.css";

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/barang")  // Mengambil produk dari API
      .then((response) => {
        setProducts(response.data.slice(0, 3));  // Mengambil 3 produk pertama
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  }, []);

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <img src="/Logo.png" alt="Reusemart Logo" />
        </div>
        <ul className="nav-links">
          <li><Link to="/">Beranda</Link></li>
          <li><Link to="/shop">Belanja</Link></li>
        </ul>
        <div className="login-link">
          <Link to="/generalLogin">Masuk</Link> {/* Tombol Login */}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text-box">
          <p className="arrival-text">New Arrival</p>
          <h1 className="hero-heading">Discover Our New Collection</h1>
          <p className="hero-description">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis.
          </p>
          <button className="buy-button"><Link to="/shop">BUY NOW</Link></button>
        </div>
      </section>

      {/* Browse The Range */}
      <section className="browse-range">
        <h2 className="range-heading">Browse The Category</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <div className="range-grid">
          <div className="range-item">
            <img src="/1.png" alt="Dining" />
            <h3>Elektronik</h3>
          </div>
          <div className="range-item">
            <img src="/2.png" alt="Living" />
            <h3>Pakaian</h3>
          </div>
          <div className="range-item">
            <img src="/image 101.png" alt="Bedroom" />
            <h3>Perabotan</h3>
          </div>
          <div className="range-item">
            <img src="/3.png" alt="Dining" />
            <h3>More</h3>
          </div>
        </div>
      </section>

      

      {/* Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <h3>ReuseMart.</h3>
            <p>Indonesia, Yogyakarta, Sleman, Depok, Catur Tunggal, Babarsari, No.111</p>
          </div>
          <div>
            <h4>Links</h4>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/shop">Shop</Link></li>
          </div>
          <div>
            <h4>Help</h4>
            <p>Payment Options</p>
            <p>Returns</p>
            <p>Privacy Policies</p>
          </div>
        </div>
        <p className="copyright">2025 ReuseMart. All rights reserved</p>
      </footer>
    </div>
  );
};

export default Home;
