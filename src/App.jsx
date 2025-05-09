import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./JSX/NoLogin/home.jsx";
import Shop from "./JSX/NoLogin/shop.jsx";
import ProductDetail from "./JSX/NoLogin/productDetail.jsx";
import Login from "./JSX/Login/Admin/login.jsx";
import AdminDashboard from "./JSX/Login/Admin/admin.jsx";
import GeneralLogin from "./JSX/Login/generalLogin.jsx";
import LoginOrganisasi from './JSX/Login/Organisasi/loginOrganisasi.jsx';
import LoginPembeli from './JSX/Login/pembeli/loginPembeli.jsx';
import LoginPenitip from './JSX/Login/Penitip/loginPenitip.jsx';
import GeneralRegistrasi from './JSX/Registrasi/generalRegistrasi.jsx';
import RegistrasiPembeli from './JSX/Registrasi/Pembeli/registrasiPembeli.jsx';
import RegistrasiOrganisasi from './JSX/Registrasi/Organisasi/registrasiOrganisasi.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // <-- Import CSS Toastify



function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/generalLogin" element={<GeneralLogin />} />
          <Route path="/generalRegister" element={<GeneralRegistrasi />} />
          <Route path="/barang/:id" element={<ProductDetail />} />
          <Route path="admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="organisasi/login" element={<LoginOrganisasi />} />
          <Route path="pembeli/login" element={<LoginPembeli />} /> 
          <Route path="penitip/login" element={<LoginPenitip />} />
          <Route path="pembeli/registrasi" element={<RegistrasiPembeli />} />
          <Route path="organisasi/registrasi" element={<RegistrasiOrganisasi />} />
        </Routes>
      </Router>
      <ToastContainer /> {/* Ini akan menampilkan toast di seluruh aplikasi */}
    </div>
  );
}

export default App;