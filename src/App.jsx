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
import CSDashboard from './JSX/Login/CS/cs.jsx';
import OrganisasiDashboard from './JSX/Login/Organisasi/dashboardOrganisasi.jsx';


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/generalLogin" element={<GeneralLogin />} />
          <Route path="/barang/:id" element={<ProductDetail />} />
          <Route path="admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="organisasi/login" element={<LoginOrganisasi />} />
          <Route path="pembeli/login" element={<LoginPembeli />} /> 
          <Route path="penitip/login" element={<LoginPenitip />} />
          <Route path="cs/dashboard" element={<CSDashboard />} />
          <Route path="/organisasi/dashboard" element={<OrganisasiDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;