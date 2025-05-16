import React, { useEffect, useState } from "react";
import axios from "axios";
import "./shop.css";
import { Link } from "react-router-dom";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    // Ambil produk dan kategori
    axios
      .get("http://127.0.0.1:8000/api/barang")
      .then((response) => {
        console.log("API Response:", response.data);
        if (Array.isArray(response.data)) {
          setProducts(response.data);
          setFilteredProducts(response.data);
        } else {
          setProducts([]);
          setError("Data produk tidak dalam format yang diharapkan.");
        }
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setError("Gagal mengambil data produk. Silakan coba lagi.");
      });

    // Ambil kategori dari API
    axios
      .get("http://127.0.0.1:8000/api/kategori-barang")
      .then((response) => {
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          setCategories([]);
          setError("Data kategori tidak dalam format yang diharapkan.");
        }
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setError("Gagal mengambil data kategori. Silakan coba lagi.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Fungsi untuk menangani pencarian produk
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    filterProducts(e.target.value, selectedCategory);
  };

  // Fungsi untuk menangani pemilihan kategori
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    filterProducts(searchQuery, e.target.value);
  };

  // Fungsi untuk memfilter produk berdasarkan pencarian dan kategori
  const filterProducts = (searchQuery, selectedCategory) => {
    let filtered = products;

    // Filter berdasarkan nama produk
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter berdasarkan kategori
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.id_kategoribarang === parseInt(selectedCategory)
      );
    }

    setFilteredProducts(filtered);
  };

  return (
    <div className="shop-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <img src="/Logo.png" alt="Reusemart Logo" />
        </div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>
          <li><Link to="/generalLogin">Login</Link></li>
        </ul>
      </nav>

      {/* Search and Category Filter */}
      <div className="shop-container">
        <h2>All Products</h2>

        {/* Search and Category Filter */}
        <div className="shop-filters">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search products..."
            className="search-input"
          />

          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="category-select"
          >
            <option value="">Select Category</option>
            {/* Loop through categories and display them */}
            {categories.map((category) => (
              <option key={category.id_kategori} value={category.id_kategori}>
                {category.nama_kategori}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p>Tidak ada produk yang tersedia.</p>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div className="product-card" key={product.id_barang}>
                <Link to={`/barang/${product.id_barang}`}>
                  <img
                    src={`http://127.0.0.1:8000/images/${product.image}`}
                    alt={product.nama_barang || "Product Image"}
                  />
                  <div className="product-info">
                    <h3>{product.nama_barang || "No Name"}</h3>
                    <p>Rp {product.harga_barang || 0}</p>
                    <button className="add-to-cart-btn">Add to Cart</button>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
