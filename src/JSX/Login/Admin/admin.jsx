import React, { useState, useEffect } from "react";
import "./admin.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("dashboard"); // menu aktif
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
  const [editEmployeeIndex, setEditEmployeeIndex] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [searchTermEmployee, setSearchTermEmployee] = useState("");

  const [organizations, setOrganizations] = useState([]);
  const [searchTermOrg, setSearchTermOrg] = useState("");
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);

  const [jabatans, setJabatans] = useState([]); // State daftar jabatan

  const [userRoleState, setUserRoleState] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const navigate = useNavigate();

  // Auth & fetch data saat load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const id_pegawai = localStorage.getItem("id_pegawai");
    const role = localStorage.getItem("userRole");
    setUserRoleState(role);

    if (!token || !role || !["admin", "manager"].includes(role)) {
      navigate("/generalLogin");
      toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profil admin
        const profileResponse = await axios.get(
          `http://127.0.0.1:8000/api/pegawai/${id_pegawai}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAdminProfile(profileResponse.data);

        // Fetch data jabatan untuk dropdown
        const jabatanResponse = await axios.get("http://127.0.0.1:8000/api/jabatan", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJabatans(jabatanResponse.data);

        // Fetch employees dan organizations
        await fetchEmployees(token);
        await fetchOrganizations(token);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        toast.error("Gagal memuat data awal.");
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      }
    };

    fetchData();
  }, [navigate]);

  // Fetch employees
  const fetchEmployees = async (token, search = "") => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/pegawai", {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      setEmployees(res.data);
      setCurrentPage(1); // Reset ke halaman 1 saat data baru masuk
    } catch (err) {
      toast.error("Gagal memuat data pegawai.");
      if (err.response && err.response.status === 401) handleLogout();
    }
  };

  // Fetch organizations
  const fetchOrganizations = async (token, search = "") => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/organisasi", {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      setOrganizations(res.data);
    } catch (err) {
      toast.error("Gagal memuat data organisasi.");
      if (err.response && err.response.status === 401) handleLogout();
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate("/generalLogin");
    toast.info("Anda telah logout.");
  };

  // Search pegawai
  const handleSearchEmployeeChange = (e) => {
    setSearchTermEmployee(e.target.value);
    fetchEmployees(localStorage.getItem("authToken"), e.target.value);
  };

  // Search organisasi
  const handleSearchOrgChange = (e) => {
    setSearchTermOrg(e.target.value);
    fetchOrganizations(localStorage.getItem("authToken"), e.target.value);
  };

  // Add/update pegawai
  const handleAddOrUpdateEmployee = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const url =
      editEmployeeIndex !== null
        ? `/api/pegawai/${employees[editEmployeeIndex].id_pegawai}`
        : "/api/pegawai";
    const method = editEmployeeIndex !== null ? "put" : "post";

    try {
      await axios[method](`http://127.0.0.1:8000${url}`, newEmployee, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchEmployees(token, searchTermEmployee);
      toast.success(
        editEmployeeIndex !== null
          ? "Pegawai berhasil diperbarui"
          : "Pegawai berhasil ditambahkan"
      );
      setShowEmployeeModal(false);
      setEditEmployeeIndex(null);
      setNewEmployee({
        nama_pegawai: "",
        email_pegawai: "",
        password_pegawai: "",
        tgl_lahir_pegawai: "",
        no_telepon_pegawai: "",
        pegawai_id_jabatan: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data pegawai.");
    }
  };

  // Delete pegawai
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pegawai ini?")) return;
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/pegawai/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmployees(token, searchTermEmployee);
      toast.success("Pegawai berhasil dihapus.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus data pegawai.");
    }
  };

  // Edit pegawai (prepare form)
  const handleEditEmployee = (index) => {
    const emp = employees[index];
    setEditEmployeeIndex(index);
    setNewEmployee({
      nama_pegawai: emp.nama_pegawai,
      email_pegawai: emp.email_pegawai,
      password_pegawai: "",
      tgl_lahir_pegawai: emp.tgl_lahir_pegawai
        ? emp.tgl_lahir_pegawai.split("T")[0]
        : "",
      no_telepon_pegawai: emp.no_telepon_pegawai,
      pegawai_id_jabatan: emp.pegawai_id_jabatan || "",
    });
    setShowEmployeeModal(true);
  };

  // Edit organisasi
  const handleEditOrganization = (org) => {
    setEditingOrganization({
      ...org,
      password_organisasi: "",
    });
    setShowOrganizationModal(true);
  };

  // Delete organisasi
  const handleDeleteOrganization = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus organisasi ini?"))
      return;
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/organisasi/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrganizations(token, searchTermOrg);
      toast.success("Organisasi berhasil dihapus.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus data organisasi.");
    }
  };

  // Update organisasi
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
      ...(editingOrganization.password_organisasi && {
        password_organisasi: editingOrganization.password_organisasi,
      }),
    };

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/organisasi/${editingOrganization.id_organisasi}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrganizations(token, searchTermOrg);
      toast.success("Organisasi berhasil diperbarui.");
      setShowOrganizationModal(false);
      setEditingOrganization(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memperbarui data organisasi.");
    }
  };

  // Pagination handling
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentEmployees = employees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(employees.length / rowsPerPage);

  const handlePageChange = (direction) => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Render konten utama berdasarkan menu aktif
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className="adminpage-dashboard-section">
            <h3>Profil Admin</h3>
            {adminProfile ? (
              <div className="adminpage-profile-details">
                <p>
                  <strong>ID:</strong> {adminProfile.id_pegawai}
                </p>
                <p>
                  <strong>Nama:</strong> {adminProfile.nama_pegawai}
                </p>
                <p>
                  <strong>Email:</strong> {adminProfile.email_pegawai}
                </p>
                <p>
                  <strong>Jabatan:</strong>{" "}
                  {adminProfile.jabatan?.nama_jabatan || "Tidak Ada"}
                </p>
                <p>
                  <strong>Role Sistem:</strong> {userRoleState || "Tidak Diketahui"}
                </p>
              </div>
            ) : (
              <p>Memuat profil...</p>
            )}
          </div>
        );
      case "pegawai":
        return (
          <div className="adminpage-dashboard-section">
            <div className="adminpage-section-header">
              <h3>Manajemen Pegawai</h3>
              <button
                className="adminpage-add-employee-btn"
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

            <div className="adminpage-search-bar">
              <input
                type="text"
                placeholder="Cari Nama Pegawai..."
                value={searchTermEmployee}
                onChange={handleSearchEmployeeChange}
              />
            </div>

            <div
              className="adminpage-table-container"
              style={{ overflowX: "auto", marginTop: "1rem" }}
            >
              {employees.length > 0 ? (
                <>
                  <table className="adminpage-employee-table">
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
                      {currentEmployees.map((emp, idx) => (
                        <tr key={emp.id_pegawai}>
                          <td>{emp.id_pegawai}</td>
                          <td>{emp.nama_pegawai}</td>
                          <td>{emp.email_pegawai}</td>
                          <td>{emp.tgl_lahir_pegawai?.split("T")[0]}</td>
                          <td>{emp.no_telepon_pegawai}</td>
                          <td>{emp.jabatan?.nama_jabatan || "Tidak Ada"}</td>
                          <td className="adminpage-table-actions">
                            <button onClick={() => handleEditEmployee(idx)}>Edit</button>
                            <button onClick={() => handleDeleteEmployee(emp.id_pegawai)}>
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="adminpage-pagination-controls">
                    <button
                      onClick={() => handlePageChange("prev")}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span>
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange("next")}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p>
                  {searchTermEmployee
                    ? `Tidak ditemukan pegawai dengan nama "${searchTermEmployee}".`
                    : "Tidak ada data pegawai."}
                </p>
              )}
            </div>
          </div>
        );
      case "organisasi":
        return (
          <div className="adminpage-dashboard-section">
            <h3>Manajemen Organisasi</h3>
            <div className="adminpage-search-bar">
              <input
                type="text"
                placeholder="Cari Nama Organisasi..."
                value={searchTermOrg}
                onChange={handleSearchOrgChange}
              />
            </div>

            <div
              className="adminpage-table-container"
              style={{ overflowX: "auto", marginTop: "1rem" }}
            >
              {organizations.length > 0 ? (
                <table className="adminpage-organization-table">
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
                    {organizations.map((org) => (
                      <tr key={org.id_organisasi}>
                        <td>{org.nama_organisasi}</td>
                        <td>{org.email_organisasi}</td>
                        <td>{org.no_telepon_organisasi}</td>
                        <td>{org.alamat_organisasi}</td>
                        <td className="adminpage-table-actions">
                          <button onClick={() => handleEditOrganization(org)}>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOrganization(org.id_organisasi)}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>
                  {searchTermOrg
                    ? `Tidak ditemukan organisasi dengan nama "${searchTermOrg}".`
                    : "Tidak ada data organisasi."}
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="adminpage-admin-dashboard">
      {/* Sidebar kiri */}
      <aside className="adminpage-sidebar">
        <div className="adminpage-sidebar-logo">REUSEMART ADMIN</div>
        <nav className="adminpage-sidebar-nav">
          <ul>
            <li
              className={activeMenu === "dashboard" ? "adminpage-active" : ""}
              onClick={() => setActiveMenu("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={activeMenu === "pegawai" ? "adminpage-active" : ""}
              onClick={() => setActiveMenu("pegawai")}
            >
              Manajemen Pegawai
            </li>
            <li
              className={activeMenu === "organisasi" ? "adminpage-active" : ""}
              onClick={() => setActiveMenu("organisasi")}
            >
              Manajemen Organisasi
            </li>
            <li onClick={handleLogout} className="adminpage-logout-btn">
              Logout
            </li>
          </ul>
        </nav>
      </aside>

      {/* Konten utama */}
      <main className="adminpage-dashboard-container">
        <h2>
          {activeMenu === "dashboard"
            ? "Dashboard Admin"
            : activeMenu === "pegawai"
            ? "Manajemen Pegawai"
            : "Manajemen Organisasi"}
        </h2>
        {renderContent()}

        {/* Modal Pegawai */}
        {showEmployeeModal && (
          <div className="adminpage-modal">
            <div className="adminpage-modal-content">
              <h3>{editEmployeeIndex !== null ? "Edit Pegawai" : "Tambah Pegawai"}</h3>
              <form onSubmit={handleAddOrUpdateEmployee}>
                <input
                  type="text"
                  placeholder="Nama"
                  value={newEmployee.nama_pegawai}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, nama_pegawai: e.target.value })
                  }
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmployee.email_pegawai}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email_pegawai: e.target.value })
                  }
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newEmployee.password_pegawai}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, password_pegawai: e.target.value })
                  }
                  required={editEmployeeIndex === null}
                />
                <input
                  type="date"
                  placeholder="Tanggal Lahir"
                  value={newEmployee.tgl_lahir_pegawai}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, tgl_lahir_pegawai: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Nomor Telepon"
                  value={newEmployee.no_telepon_pegawai}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, no_telepon_pegawai: e.target.value })
                  }
                  required
                />

                {/* Dropdown jabatan */}
                <select
                  value={newEmployee.pegawai_id_jabatan}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, pegawai_id_jabatan: e.target.value })
                  }
                  required
                >
                  <option value="">-- Pilih Jabatan --</option>
                  {jabatans.map((jabatan) => (
                    <option key={jabatan.id_jabatan} value={jabatan.id_jabatan}>
                      {jabatan.nama_jabatan}
                    </option>
                  ))}
                </select>

                <div className="adminpage-modal-actions">
                  <button type="submit">
                    {editEmployeeIndex !== null ? "Perbarui Pegawai" : "Tambah Pegawai"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmployeeModal(false);
                      setEditEmployeeIndex(null);
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Organisasi */}
        {showOrganizationModal && editingOrganization && (
          <div className="adminpage-modal">
            <div className="adminpage-modal-content">
              <h3>Edit Organisasi</h3>
              <form onSubmit={handleUpdateOrganization}>
                <input
                  type="text"
                  placeholder="Nama Organisasi"
                  value={editingOrganization.nama_organisasi || ""}
                  onChange={(e) =>
                    setEditingOrganization({ ...editingOrganization, nama_organisasi: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Alamat Organisasi"
                  value={editingOrganization.alamat_organisasi || ""}
                  onChange={(e) =>
                    setEditingOrganization({ ...editingOrganization, alamat_organisasi: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Nomor Telepon Organisasi"
                  value={editingOrganization.no_telepon_organisasi || ""}
                  onChange={(e) =>
                    setEditingOrganization({ ...editingOrganization, no_telepon_organisasi: e.target.value })
                  }
                  required
                />
                <input
                  type="email"
                  placeholder="Email Organisasi"
                  value={editingOrganization.email_organisasi || ""}
                  onChange={(e) =>
                    setEditingOrganization({ ...editingOrganization, email_organisasi: e.target.value })
                  }
                  required
                />
                <input
                  type="password"
                  placeholder="Password Baru (Opsional)"
                  value={editingOrganization.password_organisasi || ""}
                  onChange={(e) =>
                    setEditingOrganization({ ...editingOrganization, password_organisasi: e.target.value })
                  }
                  minLength="6"
                />

                <div className="adminpage-modal-actions">
                  <button type="submit">Perbarui Organisasi</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrganizationModal(false);
                      setEditingOrganization(null);
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
