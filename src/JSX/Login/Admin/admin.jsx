import React, { useState, useEffect } from "react";
import "./admin.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    // State untuk Manajemen Pegawai
    const [employees, setEmployees] = useState([]);
    const [adminProfile, setAdminProfile] = useState(null);
    const [newEmployee, setNewEmployee] = useState({
        nama_pegawai: "", email_pegawai: "", password_pegawai: "",
        tgl_lahir_pegawai: "", no_telepon_pegawai: "", pegawai_id_jabatan: "",
    });
    const [editEmployeeIndex, setEditEmployeeIndex] = useState(null);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [searchTermEmployee, setSearchTermEmployee] = useState(''); // State baru untuk pencarian pegawai

    // State untuk Manajemen Organisasi
    const [organizations, setOrganizations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingOrganization, setEditingOrganization] = useState(null);
    const [showOrganizationModal, setShowOrganizationModal] = useState(false);

    // State untuk menyimpan role user dari local storage
    const [userRoleState, setUserRoleState] = useState(null);

    const navigate = useNavigate();

    // Fungsi untuk fetch data pegawai dari backend
    const fetchEmployees = async (token, search = '') => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/pegawai`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search: search } // Kirim searchTerm sebagai query parameter
            });
            setEmployees(response.data); // Update state pegawai
        } catch (err) {
            console.error("Error fetching employees:", err);
            toast.error("Gagal memuat data pegawai.");
            if (err.response && err.response.status === 401) {
                handleLogout();
            }
        }
    };

    // Fungsi untuk fetch data organisasi dari backend
    const fetchOrganizations = async (token, search = '') => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/organisasi`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search: search }
            });
            setOrganizations(response.data);
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
        const role = localStorage.getItem("userRole");

        setUserRoleState(role);

        if (!token || !role || !['admin', 'manager'].includes(role)) {
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
                await fetchEmployees(token);

                // Fetch Data Organisasi
                await fetchOrganizations(token);

            } catch (err) {
                console.error("Error fetching initial data:", err);
                toast.error("Gagal memuat data awal.");
                if (err.response && err.response.status === 401) {
                    handleLogout();
                }
            }
        };

        if (token && role && ['admin', 'manager'].includes(role)) {
            fetchData();
        }
    }, [navigate]);

    // Handler untuk input pencarian pegawai
    const handleSearchEmployeeChange = (e) => {
        setSearchTermEmployee(e.target.value);
        const token = localStorage.getItem("authToken");
        if (token) {
            fetchEmployees(token, e.target.value);
        }
    };

    // Handler untuk input pencarian organisasi
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        const token = localStorage.getItem("authToken");
        if (token) {
            fetchOrganizations(token, e.target.value);
        }
    };

    // Handler Form Pegawai
    const handleAddOrUpdateEmployee = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        const url = editEmployeeIndex !== null ? `/api/pegawai/${employees[editEmployeeIndex].id_pegawai}` : "/api/pegawai";
        const method = editEmployeeIndex !== null ? "put" : "post";

        try {
            const response = await axios[method](`http://127.0.0.1:8000${url}`, newEmployee, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Refresh data setelah penambahan/pembaruan untuk memastikan data terkini termasuk dari hasil search
            fetchEmployees(token, searchTermEmployee);

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
            // Fetch ulang pegawai setelah delete agar daftar terupdate dengan hasil search saat ini
            fetchEmployees(token, searchTermEmployee);
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
            password_pegawai: "",
            tgl_lahir_pegawai: employees[index].tgl_lahir_pegawai ? employees[index].tgl_lahir_pegawai.split('T')[0] : '',
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
            password_organisasi: "", // Kosongkan password saat edit dibuka
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
            fetchOrganizations(token, searchTerm); // Refresh list after deletion
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
            // Hanya kirim password jika diisi saat edit
            ...(editingOrganization.password_organisasi && { password_organisasi: editingOrganization.password_organisasi }),
        };

        try {
            const response = await axios.put(`http://127.0.0.1:8000/api/organisasi/${editingOrganization.id_organisasi}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            fetchOrganizations(token, searchTerm); // Refresh list after update
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
                    {/* Link Profil mungkin perlu disesuaikan jika ada halaman profil terpisah atau hanya tampil di dashboard */}
                    {/* <li><Link to="/admin/profile">Profil</Link></li> */}
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
                            <p><strong>Jabatan:</strong> {adminProfile.jabatan?.nama_jabatan || 'Tidak Ada'}</p>
                            <p><strong>Role Sistem:</strong> {userRoleState || 'Tidak Diketahui'}</p>
                        </div>
                    ) : (
                        <p>Memuat profil...</p>
                    )}
                </div>

                {/* Bagian Manajemen Pegawai - Diubah ke Tabel */}
                {isAdminOrManager && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h3>Manajemen Pegawai</h3>
                            <button
                                className="add-employee-btn"
                                onClick={() => {
                                    setEditEmployeeIndex(null);
                                    setNewEmployee({
                                        nama_pegawai: "",
                                        email_pegawai: "",
                                        password_pegawai: "",
                                        tgl_lahir_pegawai: "",
                                        no_telepon_pegawai: "",
                                        pegawai_id_jabatan: "",
                                    });
                                    setShowEmployeeModal(true);
                                }}
                            >
                                Tambah Pegawai
                            </button>
                        </div>

                        {/* Input Search Pegawai */}
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Cari Nama Pegawai..."
                                value={searchTermEmployee}
                                onChange={handleSearchEmployeeChange}
                            />
                        </div>
                        <div className="table-container" style={{ marginTop: '1rem', overflowX: 'auto' }}> {/* Added container for scroll */}
                            {employees.length > 0 ? (
                                <table className="employee-table"> {/* Class name changed to employee-table */}
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nama Pegawai</th>
                                            <th>Email</th>
                                            <th>Tgl. Lahir</th>
                                            <th>Telepon</th>
                                            <th>Jabatan</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp, index) => (
                                            <tr key={emp.id_pegawai}>
                                                <td>{emp.id_pegawai}</td>
                                                <td>{emp.nama_pegawai}</td>
                                                <td>{emp.email_pegawai}</td>
                                                <td>{emp.tgl_lahir_pegawai ? emp.tgl_lahir_pegawai.split('T')[0] : ''}</td>
                                                <td>{emp.no_telepon_pegawai}</td>
                                                <td>{emp.jabatan?.nama_jabatan || "Tidak Ada"}</td>
                                                <td className="table-actions">
                                                    <button onClick={() => handleEditEmployee(index)}>Edit</button>
                                                    <button onClick={() => handleDeleteEmployee(emp.id_pegawai)}>Hapus</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                searchTermEmployee !== '' ? (
                                    <p>Tidak ditemukan pegawai dengan nama "{searchTermEmployee}".</p>
                                ) : (
                                    <p>Tidak ada data pegawai.</p>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Bagian Manajemen Organisasi - Diubah ke Tabel */}
                {isAdminOrManager && (
                    <div className="dashboard-section">
                        <h3>Manajemen Organisasi</h3>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Cari Nama Organisasi..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>

                        {/* Tabel Organisasi */}
                        <div className="table-container" style={{ marginTop: '1rem', overflowX: 'auto' }}> {/* Added container for scroll */}
                            {organizations.length > 0 ? (
                                <table className="organization-table">
                                    <thead>
                                        <tr>
                                            <th>Nama Organisasi</th>
                                            <th>Email</th>
                                            <th>Telepon</th>
                                            <th>Alamat</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {organizations.map(org => (
                                            <tr key={org.id_organisasi}>
                                                <td>{org.nama_organisasi}</td>
                                                <td>{org.email_organisasi}</td>
                                                <td>{org.no_telepon_organisasi}</td>
                                                <td>{org.alamat_organisasi}</td>
                                                <td className="table-actions">
                                                    <button onClick={() => handleEditOrganization(org)}>Edit</button>
                                                    <button onClick={() => handleDeleteOrganization(org.id_organisasi)}>Hapus</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                            <input type="text" placeholder="Nama" name="nama_pegawai" value={newEmployee.nama_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, nama_pegawai: e.target.value })} required />
                            <input type="email" placeholder="Email" name="email_pegawai" value={newEmployee.email_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, email_pegawai: e.target.value })} required />
                            {/* Password hanya required saat tambah atau jika diisi saat edit */}
                            <input type="password" placeholder="Password" name="password_pegawai" value={newEmployee.password_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, password_pegawai: e.target.value })} required={editEmployeeIndex === null} />
                            <input type="date" placeholder="Tanggal Lahir" name="tgl_lahir_pegawai" value={newEmployee.tgl_lahir_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, tgl_lahir_pegawai: e.target.value })} required />
                            <input type="text" placeholder="Nomor Telepon" name="no_telepon_pegawai" value={newEmployee.no_telepon_pegawai} onChange={(e) => setNewEmployee({ ...newEmployee, no_telepon_pegawai: e.target.value })} required />
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