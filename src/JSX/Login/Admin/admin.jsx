// src\JSX\Login\Admin\admin.jsx (Modified)
import React, { useState, useEffect } from "react";
import "./admin.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';


const AdminDashboard = () => {
    // State untuk Manajemen Pegawai
    const [employees, setEmployees] = useState([]);
    const [adminProfile, setAdminProfile] = useState(null); // Profil admin/pegawai yang login
    const [newEmployee, setNewEmployee] = useState({ // State form tambah pegawai
        nama_pegawai: "", email_pegawai: "", password_pegawai: "",
        tgl_lahir_pegawai: "", no_telepon_pegawai: "", pegawai_id_jabatan: "",
    });
    const [editEmployeeIndex, setEditEmployeeIndex] = useState(null); // Index pegawai yang diedit
    const [showEmployeeModal, setShowEmployeeModal] = useState(false); // Status modal pegawai

    // State BARU untuk Manajemen Organisasi
    const [organizations, setOrganizations] = useState([]); // Menyimpan data organisasi dari API
    const [searchTerm, setSearchTerm] = useState(''); // State untuk input pencarian organisasi

    // State untuk Modal Edit Organisasi
    const [editingOrganization, setEditingOrganization] = useState(null); // Data organisasi yang sedang diedit (object atau null)
    const [showOrganizationModal, setShowOrganizationModal] = useState(false); // Status buka/tutup modal organisasi

    // State BARU untuk menyimpan role user dari local storage
    const [userRoleState, setUserRoleState] = useState(null);


    const navigate = useNavigate();

    // Fungsi untuk fetch data organisasi dari backend
    const fetchOrganizations = async (token, search = '') => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/organisasi`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search: search } // Kirim searchTerm sebagai query parameter
            });
            setOrganizations(response.data); // Update state organisasi
        } catch (err) {
            console.error("Error fetching organizations:", err);
            toast.error("Gagal memuat data organisasi.");
            if (err.response && err.response.status === 401) {
                handleLogout();
            }
        }
    };


    // useEffect untuk cek role dan fetch data awal
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const id_pegawai = localStorage.getItem("id_pegawai");
        const role = localStorage.getItem("userRole"); // <-- Ambil role dari local storage

        // Simpan role di state
        setUserRoleState(role); // <-- Set state role

        // Cek role untuk pengamanan rute
        if (!token || !role || !['admin', 'manager'].includes(role)) { // <-- Gunakan role dari local storage
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
            return;
        }


        const fetchData = async () => {
            try {
                // Fetch Profil Admin/Pegawai
                const profileResponse = await axios.get(`http://127.0.0.1:8000/api/pegawai/${id_pegawai}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAdminProfile(profileResponse.data);

                // Fetch Data Pegawai
                const employeesResponse = await axios.get("http://127.0.0.1:8000/api/pegawai", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setEmployees(employeesResponse.data);

                // Fetch Data Organisasi (tanpa parameter search di awal)
                await fetchOrganizations(token);


            } catch (err) {
                console.error("Error fetching initial data:", err);
                toast.error("Gagal memuat data awal.");
                if (err.response && err.response.status === 401) {
                    handleLogout();
                }
            }
        };

        // Panggil fetchData hanya jika sudah lolos cek token dan role awal
         if (token && role && ['admin', 'manager'].includes(role)) {
             fetchData();
         }

    }, [navigate]); // Dependency array


    // Handler untuk input pencarian organisasi
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        const token = localStorage.getItem("authToken");
        if (token) {
            // Panggil fetchOrganizations dengan searchTerm yang baru
            fetchOrganizations(token, e.target.value);
        }
    };


    // Handler Form Pegawai (kode sudah ada, hanya penyesuaian nama state/fungsi)
    const handleAddOrUpdateEmployee = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        const url = editEmployeeIndex !== null ? `/api/pegawai/${employees[editEmployeeIndex].id_pegawai}` : "/api/pegawai";
        const method = editEmployeeIndex !== null ? "put" : "post";

        try {
            const response = await axios[method](`http://127.0.0.1:8000${url}`, newEmployee, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const updatedEmployees = editEmployeeIndex !== null
                ? employees.map((emp, index) => (index === editEmployeeIndex ? response.data.data || response.data : emp))
                : [...employees, response.data.data || response.data];

            setEmployees(updatedEmployees);
            toast.success(response.data.message || (editEmployeeIndex !== null ? "Pegawai berhasil diperbarui" : "Pegawai berhasil ditambahkan"));

            handleCloseEmployeeModal();

        } catch (err) {
            console.error("Error adding/updating employee:", err);
            const errorMessage = err.response?.data?.message || "Gagal menyimpan data pegawai.";
            toast.error(errorMessage);
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus pegawai ini?")) {
            return;
        }
        const token = localStorage.getItem("authToken");
        try {
            await axios.delete(`http://127.0.0.1:8000/api/pegawai/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEmployees(employees.filter((emp) => emp.id_pegawai !== id));
            toast.success("Pegawai berhasil dihapus.");
        } catch (err) {
            console.error("Error deleting employee:", err);
            const errorMessage = err.response?.data?.message || "Gagal menghapus data pegawai.";
            toast.error(errorMessage);
        }
    };

    const handleEditEmployee = (index) => {
        setEditEmployeeIndex(index);
        setNewEmployee({
            nama_pegawai: employees[index].nama_pegawai,
            email_pegawai: employees[index].email_pegawai,
            password_pegawai: "", // Kosongkan password saat edit
            tgl_lahir_pegawai: employees[index].tgl_lahir_pegawai ? employees[index].tgl_lahir_pegawai.split('T')[0] : '', // Format<ctrl97>-MM-DD
            no_telepon_pegawai: employees[index].no_telepon_pegawai,
            pegawai_id_jabatan: employees[index].pegawai_id_jabatan || '',
        });
        setShowEmployeeModal(true);
    };

    const handleCloseEmployeeModal = () => {
        setShowEmployeeModal(false);
        setEditEmployeeIndex(null);
        setNewEmployee({
            nama_pegawai: "", email_pegawai: "", password_pegawai: "",
            tgl_lahir_pegawai: "", no_telepon_pegawai: "", pegawai_id_jabatan: "",
        });
    };


    // Handler untuk update data Organisasi
    const handleEditOrganization = (organization) => {
        setEditingOrganization({
            ...organization,
            password_organisasi: "", // Kosongkan password saat edit
        });
        setShowOrganizationModal(true);
    };

    const handleDeleteOrganization = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus organisasi ini?")) {
            return;
        }
        const token = localStorage.getItem("authToken");
        try {
            await axios.delete(`http://127.0.0.1:8000/api/organisasi/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Fetch ulang organisasi setelah delete agar daftar terupdate dengan hasil search saat ini
            fetchOrganizations(token, searchTerm);
            toast.success("Organisasi berhasil dihapus.");
        } catch (err) {
            console.error("Error deleting organization:", err);
            const errorMessage = err.response?.data?.message || "Gagal menghapus data organisasi.";
            toast.error(errorMessage);
        }
    };

    const handleUpdateOrganization = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        if (!editingOrganization || !editingOrganization.id_organisasi) {
            toast.error("Data organisasi tidak valid.");
            return;
        }

        const payload = {
            nama_organisasi: editingOrganization.nama_organisasi,
            alamat_organisasi: editingOrganization.alamat_organisasi,
            no_telepon_organisasi: editingOrganization.no_telepon_organisasi,
            email_organisasi: editingOrganization.email_organisasi,
            ...(editingOrganization.password_organisasi && { password_organisasi: editingOrganization.password_organisasi }),
        };

        try {
            const response = await axios.put(`http://127.0.0.1:8000/api/organisasi/${editingOrganization.id_organisasi}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Organization update successful:", response.data);
            // Fetch ulang organisasi setelah update agar daftar terupdate dengan hasil search saat ini
            fetchOrganizations(token, searchTerm);
            toast.success(response.data.message || "Organisasi berhasil diperbarui.");

            handleCloseOrganizationModal();

        } catch (err) {
            console.error("Error updating organization:", err);
            const errorMessage = err.response?.data?.message || "Gagal memperbarui data organisasi.";
            toast.error(errorMessage);
        }
    };

    const handleCloseOrganizationModal = () => {
        setShowOrganizationModal(false);
        setEditingOrganization(null);
    };


    const handleLogout = () => {
        localStorage.removeItem("userRole");
        localStorage.removeItem("authToken");
        localStorage.removeItem("id_pegawai");
        localStorage.removeItem("name");
        localStorage.removeItem("jabatan");
        localStorage.removeItem("id_organisasi");
        localStorage.removeItem("nama_organisasi");
        localStorage.removeItem("email_organisasi");
        localStorage.removeItem("id_pembeli");
        localStorage.removeItem("username_pembeli");
        localStorage.removeItem("email_pembeli");
        localStorage.removeItem("id_penitip");
        localStorage.removeItem("email_penitip");
        localStorage.removeItem("no_telepon_penitip");

        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    // Tentukan apakah user adalah admin atau manager untuk menampilkan bagian manajemen
    const isAdminOrManager = userRoleState && ['admin', 'manager'].includes(userRoleState);


    return (
        <div className="admin-dashboard">
            {/* Navbar */}
            <nav className="navbar">
                <div className="logo">
                    <span>REUSEMART ADMIN</span>
                </div>
                <ul className="nav-links">
                    <li><Link to="/admin/dashboard">Dashboard</Link></li>
                    {/* Link profil mungkin perlu disesuaikan berdasarkan role admin */}
                    <li><Link to="/admin/profile">Profil</Link></li> {/* Asumsikan ada rute ini */}
                    <li><button onClick={handleLogout}>Logout</button></li>

                </ul>
            </nav>

            {/* Dashboard */}
            <div className="dashboard-container">
                <h2>Dashboard Admin</h2>

                {/* Bagian Profil Admin */}
                <div className="dashboard-section">
                    <h3>Profil Admin</h3>
                    {adminProfile ? (
                        <div className="profile-details">
                            <p><strong>ID:</strong> {adminProfile.id_pegawai}</p>
                            <p><strong>Nama:</strong> {adminProfile.nama_pegawai}</p>
                            <p><strong>Email:</strong> {adminProfile.email_pegawai}</p>
                            {/* Tampilkan jabatan jika ada relasi yang diload */}
                            <p><strong>Jabatan:</strong> {adminProfile.jabatan?.nama_jabatan || 'Tidak Ada'}</p>
                            {/* Tampilkan role yang digunakan untuk conditional rendering */}
                             <p><strong>Role Sistem:</strong> {userRoleState || 'Tidak Diketahui'}</p>
                        </div>
                    ) : (
                        <p>Memuat profil...</p>
                    )}
                    {/* Link edit profil */}
                    {/* <Link to="/admin/profile" className="profile-link">Edit Profil</Link> */}
                </div>

                {/* Bagian Manajemen Pegawai */}
                {isAdminOrManager && (
                  <div className="dashboard-section">
                    {/* BUNGKUS JUDUL DAN TOMBOL DALAM DIV BARU */}
                    <div className="section-header"> {/* <-- Tambahkan div baru */}
                      <h3>Manajemen Pegawai</h3> {/* Judul */}
                      {/* UNCOMMENT tombol Tambah Pegawai */}
                      <button
                        className="add-employee-btn"
                        onClick={() => {
                          setEditEmployeeIndex(null); // Pastikan mode 'add'
                          setNewEmployee({
                            // Reset form
                            nama_pegawai: "",
                            email_pegawai: "",
                            password_pegawai: "",
                            tgl_lahir_pegawai: "",
                            no_telepon_pegawai: "",
                            pegawai_id_jabatan: "",
                          });
                          setShowEmployeeModal(true); // Tampilkan modal pegawai
                        }}
                      >
                        Tambah Pegawai
                      </button> {/* Tombol */}
                    </div> {/* <-- Tutup div baru */}

                    <p>Daftar Pegawai:</p> {/* Ini tetap di bawah */}
                    <div className="employee-list">
                      {/* ... Daftar Pegawai JSX ... */}
                      {employees.length > 0 ? (
                        employees.map((emp, index) => (
                          <div key={emp.id_pegawai} className="employee-card">
                            <span>
                              {emp.nama_pegawai} - {emp.jabatan?.nama_jabatan || "Tidak Ada"} (
                              {emp.email_pegawai})
                            </span>
                            <div>
                              <button onClick={() => handleEditEmployee(index)}>Edit</button>
                              <button onClick={() => handleDeleteEmployee(emp.id_pegawai)}>Hapus</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>Tidak ada data pegawai.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bagian Manajemen Organisasi */}
                {/* Tampilkan bagian ini hanya jika userRoleState adalah admin atau manager */}
                 {isAdminOrManager && (
                    <div className="dashboard-section">
                        <h3>Manajemen Organisasi</h3>
                        {/* Input Search Organisasi */}
                        <div className="search-bar"> {/* style marginBottom dipindahkan ke sini */}
                            <input
                                type="text"
                                placeholder="Cari Nama Organisasi..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>

                        {/* Daftar Organisasi */}
                        <div className="organization-list" style={{ marginTop: '1rem' }}> {/* style marginTop dipindahkan ke sini */}
                            {organizations.length > 0 ? (
                                organizations.map(org => (
                                    <div key={org.id_organisasi} className="organization-card employee-card">
                                        <span>{org.nama_organisasi} ({org.email_organisasi}) - Telp: {org.no_telepon_organisasi} - Alamat: {org.alamat_organisasi}</span>
                                        <div>
                                            <button onClick={() => handleEditOrganization(org)}>Edit</button>
                                            <button onClick={() => handleDeleteOrganization(org.id_organisasi)}>Hapus</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                searchTerm !== '' ? (
                                    <p>Tidak ditemukan organisasi dengan nama "{searchTerm}".</p>
                                ) : (
                                    <p>Tidak ada data organisasi.</p>
                                )
                            )}
                        </div>
                    </div>
                 )}

            </div>

            {/* Modal Tambah / Edit Pegawai */}
            {showEmployeeModal && (
                 <div className="modal">
                    <div className="modal-content">
                         <h3>{editEmployeeIndex !== null ? "Edit Pegawai" : "Tambah Pegawai"}</h3>
                         <form onSubmit={handleAddOrUpdateEmployee}>
                             {/* Input fields pegawai */}
                            <input type="text" placeholder="Nama" name="nama_pegawai" value={newEmployee.nama_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, nama_pegawai: e.target.value })} required />
                            <input type="email" placeholder="Email" name="email_pegawai" value={newEmployee.email_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, email_pegawai: e.target.value })} required />
                            <input type="password" placeholder="Password" name="password_pegawai" value={newEmployee.password_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, password_pegawai: e.target.value })} required={editEmployeeIndex === null || newEmployee.password_pegawai !== ""} />
                            <input type="date" placeholder="Tanggal Lahir" name="tgl_lahir_pegawai" value={newEmployee.tgl_lahir_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, tgl_lahir_pegawai: e.target.value })} required />
                            <input type="text" placeholder="Nomor Telepon" name="no_telepon_pegawai" value={newEmployee.no_telepon_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, no_telepon_pegawai: e.target.value })} required />
                            {/* Ganti input text ini jika Anda punya dropdown jabatan */}
                            <input type="text" placeholder="ID Jabatan" name="pegawai_id_jabatan" value={newEmployee.pegawai_id_jabatan} onChange={(e) => setNewEmployee({ ...newEmployee, pegawai_id_jabatan: e.target.value })} required />

                             <div className="modal-actions">
                                 <button type="submit">{editEmployeeIndex !== null ? "Perbarui Pegawai" : "Tambah Pegawai"}</button>
                                 <button type="button" onClick={handleCloseEmployeeModal}>Tutup</button>
                             </div>
                         </form>
                    </div>
                 </div>
            )}

            {/* Modal Edit Organisasi */}
            {showOrganizationModal && editingOrganization && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Edit Organisasi</h3>
                        <form onSubmit={handleUpdateOrganization}>
                            <input type="text" placeholder="Nama Organisasi" name="nama_organisasi" value={editingOrganization.nama_organisasi || ''} onChange={(e) => setEditingOrganization({ ...editingOrganization, nama_organisasi: e.target.value })} required />
                            <input type="text" placeholder="Alamat Organisasi" name="alamat_organisasi" value={editingOrganization.alamat_organisasi || ''} onChange={(e) => setEditingOrganization({ ...editingOrganization, alamat_organisasi: e.target.value })} required />
                            <input type="text" placeholder="Nomor Telepon Organisasi" name="no_telepon_organisasi" value={editingOrganization.no_telepon_organisasi || ''} onChange={(e) => setEditingOrganization({ ...editingOrganization, no_telepon_organisasi: e.target.value })} required />
                            <input type="email" placeholder="Email Organisasi" name="email_organisasi" value={editingOrganization.email_organisasi || ''} onChange={(e) => setEditingOrganization({ ...editingOrganization, email_organisasi: e.target.value })} required />
                            <input type="password" placeholder="Password Baru (Opsional)" name="password_organisasi" value={editingOrganization.password_organisasi || ''} onChange={(e) => setEditingOrganization({ ...editingOrganization, password_organisasi: e.target.value })} minLength="6" />

                            <div className="modal-actions">
                                <button type="submit">Perbarui Organisasi</button>
                                <button type="button" onClick={handleCloseOrganizationModal}>Tutup</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;