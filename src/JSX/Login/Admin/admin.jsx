import React, { useState, useEffect } from "react";
import "./admin.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    nama_pegawai: "",
    email_pegawai: "",
    password_pegawai: "",
    tgl_lahir_pegawai: "",
    no_telepon_pegawai: "",
    pegawai_id_jabatan: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    // Hanya izinkan peran 'admin' atau 'manager' untuk mengakses dashboard ini
    if (!['admin', 'manager'].includes(userRole)) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      const id_pegawai = localStorage.getItem("id_pegawai");

      try {
        const profileResponse = await axios.get(`http://127.0.0.1:8000/api/pegawai/${id_pegawai}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdminProfile(profileResponse.data);

        const employeesResponse = await axios.get("http://127.0.0.1:8000/api/pegawai", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(employeesResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [navigate]);

  const handleAddOrUpdateEmployee = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const url = editIndex !== null ? `/api/pegawai/${employees[editIndex].id_pegawai}` : "/api/pegawai";
    const method = editIndex !== null ? "put" : "post";
  
    try {
      const response = await axios[method](`http://127.0.0.1:8000${url}`, newEmployee, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update state employees langsung setelah berhasil edit/tambah
      const updatedEmployees = editIndex !== null
        ? employees.map((emp, index) => (index === editIndex ? response.data : emp))
        : [...employees, response.data];
  
      setEmployees(updatedEmployees); // Update employees state langsung
  
      // Reset form and close modal after update
      handleCloseModal(); // Close modal and reset form
    } catch (err) {
      console.error("Error adding/updating employee:", err);
    }
  };

  const handleDeleteEmployee = async (id) => {
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/pegawai/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(employees.filter((emp) => emp.id_pegawai !== id));
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  const handleEditEmployee = (index) => {
    setEditIndex(index);
    setNewEmployee({
      nama_pegawai: employees[index].nama_pegawai,
      email_pegawai: employees[index].email_pegawai,
      password_pegawai: "", // Empty password field since we shouldn't show it for editing
      tgl_lahir_pegawai: employees[index].tgl_lahir_pegawai,
      no_telepon_pegawai: employees[index].no_telepon_pegawai,
      pegawai_id_jabatan: employees[index].pegawai_id_jabatan,
    });
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    localStorage.removeItem("id_pegawai");
    localStorage.removeItem("name");
    localStorage.removeItem("jabatan");
    navigate("/");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditIndex(null); // Reset to "add" mode
    setNewEmployee({
      nama_pegawai: "",
      email_pegawai: "",
      password_pegawai: "",
      tgl_lahir_pegawai: "",
      no_telepon_pegawai: "",
      pegawai_id_jabatan: "",
    }); // Reset form values when closing modal
  };

  return (
    <div className="admin-dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>REUSEMART ADMIN</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/admin/dashboard">Dashboard</Link></li>
          <li><Link to="/admin/profile">Profil</Link></li>
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Keluar
            </button>
          </li>
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
            </div>
          ) : (
            <p>Memuat profil...</p>
          )}
          <Link to="/admin/profile" className="profile-link">
            Edit Profil
          </Link>
        </div>

        {/* Bagian Manajemen Pegawai */}
        <div className="dashboard-section">
          <h3>Manajemen Pegawai</h3>
          <button className="add-employee-btn" onClick={() => setShowModal(true)}>
            Tambah Pegawai
          </button>
          <div className="employee-list">
            {employees.map((emp, index) => (
              <div key={emp.id_pegawai} className="employee-card">
                <span>{emp.nama_pegawai} - {emp.jabatan?.nama_jabatan || 'Tidak Ada'} ({emp.email_pegawai})</span>
                <div>
                  <button onClick={() => handleEditEmployee(index)}>Edit</button>
                  <button onClick={() => handleDeleteEmployee(emp.id_pegawai)}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit Pegawai */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editIndex !== null ? "Edit Pegawai" : "Tambah Pegawai"}</h3>
            <form onSubmit={handleAddOrUpdateEmployee}>
              <input
                type="text"
                placeholder="Nama"
                value={newEmployee.nama_pegawai}
                onChange={(e) => setNewEmployee({ ...newEmployee, nama_pegawai: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmployee.email_pegawai}
                onChange={(e) => setNewEmployee({ ...newEmployee, email_pegawai: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newEmployee.password_pegawai}
                onChange={(e) => setNewEmployee({ ...newEmployee, password_pegawai: e.target.value })}
                required
              />
              <input
                type="date"
                placeholder="Tanggal Lahir"
                value={newEmployee.tgl_lahir_pegawai}
                onChange={(e) => setNewEmployee({ ...newEmployee, tgl_lahir_pegawai: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Nomor Telepon"
                value={newEmployee.no_telepon_pegawai}
                onChange={(e) => setNewEmployee({ ...newEmployee, no_telepon_pegawai: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Jabatan"
                value={newEmployee.pegawai_id_jabatan}
                onChange={(e) => setNewEmployee({ ...newEmployee, pegawai_id_jabatan: e.target.value })}
                required
              />
              <div className="modal-actions">
                <button type="submit">
                  {editIndex !== null ? "Perbarui Pegawai" : "Tambah Pegawai"}
                </button>
                <button type="button" onClick={handleCloseModal}>Tutup</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
