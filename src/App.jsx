import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./JSX/NoLogin/home.jsx";
import Shop from "./JSX/NoLogin/shop.jsx";
import ProductDetail from "./JSX/NoLogin/productDetail.jsx";
import Login from "./JSX/Login/Admin/login.jsx";
import AdminDashboard from "./JSX/Login/Admin/admin.jsx";
import PenitipDashboard from './JSX/Login/Penitip/dashboardPenitip.jsx';
import PembeliDashboard from './JSX/Login/pembeli/dashboardPembeli.jsx';
import CSDashboard from './JSX/Login/CS/dashboardCS.jsx';
import GeneralLogin from "./JSX/Login/generalLogin.jsx";
import LoginOrganisasi from './JSX/Login/Organisasi/loginOrganisasi.jsx';
import LoginPembeli from './JSX/Login/pembeli/loginPembeli.jsx';
import LoginPenitip from './JSX/Login/Penitip/loginPenitip.jsx';
import GeneralRegistrasi from './JSX/Registrasi/generalRegistrasi.jsx';
import RegistrasiPembeli from './JSX/Registrasi/Pembeli/registrasiPembeli.jsx';
import RegistrasiOrganisasi from './JSX/Registrasi/Organisasi/registrasiOrganisasi.jsx';
import DashboardOwner from './JSX/Login/Owner/dashboardOwner.jsx';
import DashboardPegawaiGudang from './JSX/Login/PegawaiGudang/dashboardPegawaiGudang.jsx';
import LiveCodeOrganisasi from './JSX/Login/Owner/liveCodeOrganisasi.jsx';
import DashboardOrganisasi from './JSX/Login/Organisasi/dashboardOrganisasi.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import ErrorBoundary from "./ErrorBoundary";


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
          <Route path="/penitip/dashboard" element={<PenitipDashboard />} />
          <Route path="/pembeli/dashboard" element={<PembeliDashboard />} />
          <Route path="/cs/dashboard" element={<CSDashboard />} />
          <Route path="organisasi/login" element={<LoginOrganisasi />} />
          <Route path="pembeli/login" element={<LoginPembeli />} /> 
          <Route path="penitip/login" element={<LoginPenitip />} />
          <Route path="pembeli/registrasi" element={<RegistrasiPembeli />} />
          <Route path="organisasi/registrasi" element={<RegistrasiOrganisasi />} />
          <Route path="/owner/dashboard" element={<ErrorBoundary>
              <DashboardOwner />
            </ErrorBoundary>} />
          <Route path="/pegawaiGudang/dashboard" element={<ErrorBoundary><DashboardPegawaiGudang /></ErrorBoundary>} />
          <Route path="/organisasi/dashboard" element={<DashboardOrganisasi />} />
          <Route path="/livecode/organisasi" element={<LiveCodeOrganisasi />} />
        </Routes>
      </Router>
      <ToastContainer /> {/* Ini akan menampilkan toast di seluruh aplikasi */}
    </div>
  );
}

export default App;