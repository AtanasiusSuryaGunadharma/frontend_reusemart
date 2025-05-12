/* eslint-disable no-unused-vars */
import React from "react";
import { Link } from "react-router-dom"; // Import Link
import "./generalLogin.css";
import { FaUserTie, FaWarehouse, FaBuilding, FaShoppingCart } from 'react-icons/fa';
// Hapus import axios, useState, useNavigate jika tidak digunakan di sini lagi

const GeneralLogin = () => {
    // Hapus state untuk email, password, rememberMe, error
    // Hapus fungsi handleSubmit
    // Hapus useEffect jika ada yang berkaitan dengan form login

    // Data untuk setiap role login
    const roles = [
        { name: "Pegawai", description: "Masuk sebagai pegawai", link: "/admin/login", IconComponent: FaUserTie }, // Link ke halaman login pegawai
        { name: "Penitip", description: "Masuk untuk menitipkan barang", link: "/penitip/login", IconComponent: FaWarehouse }, // Akan diarahkan ke halaman login penitip
        { name: "Organisasi", description: "Masuk sebagai perwakilan organisasi", link: "JSX/Login/Organisasi/loginOrganisasi", IconComponent: FaBuilding }, // Akan diarahkan ke halaman login organisasi
        { name: "Pembeli", description: "Masuk untuk berbelanja", link: "/pembeli/login", IconComponent: FaShoppingCart }, // Akan diarahkan ke halaman login pembeli
    ];

    return (
        <div className="login-page">
            {/* Navbar - Tetap sama */}
            <nav className="navbar">
                <ul className="nav-links">
                    <li><Link to="/">Beranda</Link></li>
                </ul>
                <div className="nav-icons">
                     <i className="fas fa-search"></i> {/* Jika ikon search juga tidak muncul, Anda mungkin perlu mencari alternatif Font Awesome ini juga */}
                 </div>
            </nav>

            {/* Konten untuk pilihan role */}
            <div className="role-selection-container">
                <div className="login-logo">
                    <img src="/Logo.png" alt="Reusemart Logo" />
                </div>
                <h2>Pilih Role Login Anda</h2>
                <p>Silakan pilih jenis akun Anda untuk melanjutkan.</p>

                <div className="role-cards-grid">
                    {roles.map((role) => (
                        <Link to={role.link} key={role.name} className="role-card">
                            {/* Render komponen ikon di sini */}
                            {/* Anda bisa menambahkan class role-icon ke komponen ini jika ingin styling CSS yang sama */}
                            <role.IconComponent className="role-icon" />
                            <h3>{role.name}</h3>
                            <p>{role.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GeneralLogin;