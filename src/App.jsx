import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./JSX/NoLogin/home.jsx";
import Shop from "./JSX/NoLogin/shop.jsx"; // Shop Guest
import ProductDetail from "./JSX/NoLogin/productDetail.jsx"; // Detail Produk Guest

import Login from "./JSX/Login/Admin/login.jsx"; // Login Pegawai umum
import AdminDashboard from "./JSX/Login/Admin/admin.jsx";
import PenitipDashboard from './JSX/Login/Penitip/dashboardPenitip.jsx';
import PembeliDashboard from './JSX/Login/pembeli/dashboardPembeli.jsx'; // Dashboard/Profil Pembeli
import CSDashboard from './JSX/Login/CS/dashboardCS.jsx';
import GeneralLogin from "./JSX/Login/generalLogin.jsx"; // Halaman pilihan Login
import LoginOrganisasi from './JSX/Login/Organisasi/loginOrganisasi.jsx';
import LoginPembeli from './JSX/Login/pembeli/loginPembeli.jsx'; // Login Pembeli
import LoginPenitip from './JSX/Login/Penitip/loginPenitip.jsx';


import GeneralRegistrasi from "./JSX/Registrasi/generalRegistrasi.jsx";
import RegistrasiPembeli from './JSX/Registrasi/Pembeli/registrasiPembeli.jsx';
import RegistrasiOrganisasi from './JSX/Registrasi/Organisasi/registrasiOrganisasi.jsx';

import DashboardOwner from './JSX/Login/Owner/dashboardOwner.jsx';
import DashboardPegawaiGudang from './JSX/Login/PegawaiGudang/dashboardPegawaiGudang.jsx';
import PrintNotaPage from './JSX/Login/PegawaiGudang/printNota.jsx';
import LiveCodeOrganisasi from './JSX/Login/Owner/liveCodeOrganisasi.jsx';
import DashboardOrganisasi from './JSX/Login/Organisasi/dashboardOrganisasi.jsx';


// Import komponen baru untuk Pembeli setelah login
import ShopPembeli from './JSX/Login/Pembeli/shopPembeli.jsx'; // <-- BARU
import Cart from './JSX/Login/Pembeli/Cart.jsx'; // <-- BARU
import ProductDetailPembeli from './JSX/Login/Pembeli/productDetailPembeli.jsx'; // <-- BARU: Import ProductDetailPembeli
import Checkout from './JSX/Login/Pembeli/Checkout.jsx'; 
import PaymentPage from './JSX/Login/Pembeli/PaymentPage.jsx';
import TransactionHistory from './JSX/Login/Pembeli/transaksiHistory.jsx';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ErrorBoundary from "./ErrorBoundary"; // Pastikan ErrorBoundary ada

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} /> {/* Shop versi Guest */}
          <Route path="/generalLogin" element={<GeneralLogin />} />
          <Route path="/generalRegister" element={<GeneralRegistrasi />} />
          <Route path="/barang/:id" element={<ProductDetail />} /> {/* Detail Produk Guest */}

          {/* Rute Login Spesifik */}
          <Route path="admin/login" element={<Login />} /> {/* Login Pegawai (umum) */}
          <Route path="organisasi/login" element={<LoginOrganisasi />} />
          <Route path="pembeli/login" element={<LoginPembeli />} />
          <Route path="penitip/login" element={<LoginPenitip />} />

          {/* Rute Dashboard/Profil */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/penitip/dashboard" element={<PenitipDashboard />} />
          <Route path="/pembeli/dashboard" element={<PembeliDashboard />} /> {/* Dashboard ini sekarang jadi Profil Pembeli */}
          <Route path="/cs/dashboard" element={<CSDashboard />} />
          <Route path="/owner/dashboard" element={<ErrorBoundary><DashboardOwner /></ErrorBoundary>} />
          <Route path="/pegawaiGudang/dashboard" element={<ErrorBoundary><DashboardPegawaiGudang /></ErrorBoundary>} />
          <Route path="/print-nota/:id" element={<PrintNotaPage />} />
          <Route path="/organisasi/dashboard" element={<DashboardOrganisasi />} />
          <Route path="/livecode/organisasi" element={<LiveCodeOrganisasi />} />

          {/* Rute Registrasi */}
          <Route path="pembeli/registrasi" element={<RegistrasiPembeli />} />
          <Route path="organisasi/registrasi" element={<RegistrasiOrganisasi />} />

          {/* Rute BARU untuk SHOP versi Pembeli yang sudah login */}
          <Route path="/shop-pembeli" element={<ShopPembeli />} /> {/* <-- BARU */}

          {/* Rute BARU untuk Halaman Keranjang */}
          <Route path="/cart" element={<Cart />} /> {/* <-- BARU */}

          {/* Rute BARU untuk DETAIL PRODUK versi Pembeli yang sudah login */}
          <Route path="/pembeli/barang/:id" element={<ProductDetailPembeli />} /> {/* <-- BARU */}

          <Route path="/checkout" element={<Checkout />} /> {/* <-- BARU: Rute Checkout */}

          <Route path="/payment" element={<PaymentPage />} />

          <Route path="/pembeli/history" element={<TransactionHistory />} />
        </Routes>
      </Router>
      <ToastContainer /> {/* ToastContainer di sini */}
    </div>
  );
}

export default App;
