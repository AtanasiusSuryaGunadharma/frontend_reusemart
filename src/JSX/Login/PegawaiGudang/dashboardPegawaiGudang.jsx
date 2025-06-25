/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./dashboardPegawaiGudang.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "Tidak Diketahui";
  return dateString.split("T")[0]; // Extracts YYYY-MM-DD
};

const DashboardPegawaiGudang = () => {
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [consignmentTransactions, setConsignmentTransactions] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [consignedItems, setConsignedItems] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false); 
  const [dropdownData, setDropdownData] = useState({
    kategoriBarangs: [],
    penitips: [],
    pegawais: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [currentItemsPage, setCurrentItemsPage] = useState(1);
  const [currentBarangPage, setCurrentBarangPage] = useState(1); 
  const [currentConsignedPage, setCurrentConsignedPage] = useState(1); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 7;

  const [addData, setAddData] = useState({
    nama_barang: "",
    deskripsi_barang: "",
    harga_barang: "",
    berat_barang: "",
    status_barang: "aktif",
    tanggal_garansi: "",
    id_kategoribarang: "",
    jumlah_barang: "1",
    penitip_id: "",
    pegawai_id: "",
    tanggal_mulai: "",
    tanggal_akhir: "",
    tanggal_batas: "",
    image: null,
    image2: null,
  });

  const [editData, setEditData] = useState({
    tanggal_mulai_penitipan: "",
    tanggal_akhir_penitipan: "",
    tanggal_diperpanjang: "",
    status_penitipan: "",
    tanggal_batas_penitipan: "",
    penitip_id_penitipan: "",
    pegawai_id_penitipan: "",
    image: null,
    image2: null,
  });

  const navigate = useNavigate();

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

  const fetchEmployeeProfile = async (token, employeeId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/pegawai/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Profile:", response.data);
      setEmployeeProfile(response.data);
    } catch (err) {
      console.error("Error fetching employee profile:", err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchConsignmentTransactions = async (token, query = "") => {
    try {
      const url = query
        ? `http://127.0.0.1:8000/api/transaksi-penitipan/search?query=${encodeURIComponent(query)}`
        : `http://127.0.0.1:8000/api/transaksi-penitipan`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Response - Consignment Transactions:", response.data);
      setConsignmentTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching consignment transactions:", err.response?.data || err.message);
      if (err.response?.status === 404) {
        console.warn("Endpoint search belum tersedia. Menggunakan data yang sudah dimuat.");
      } else {
        setError("Gagal memuat daftar transaksi penitipan.");
        if (err.response?.status === 401) handleLogout();
      }
      setConsignmentTransactions([]);
    }
  };

  const fetchBarangList = async (token) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/barang/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Response - Barang List:", response.data);
      setBarangList(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching barang list:", err.response?.data || err.message);
      setError("Gagal memuat daftar barang titipan.");
      if (err.response?.status === 401) handleLogout();
      setBarangList([]);
    }
  };

  const fetchConsignedItems = async (token) => {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const startDate = oneMonthAgo.toISOString().split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];

      const response = await axios.get(`http://127.0.0.1:8000/api/barang/byMonths`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConsignedItems(response.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      setConsignedItems([]);
    }
  };

  const fetchBarangDetail = async (token, id) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/barang/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Response - Barang Detail:", response.data);
      setSelectedBarang(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching barang detail:", err.response?.data || err.message);
      toast.error("Gagal memuat detail barang.");
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchDropdownData = async (token) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/transaksi-penitipan/dropdown-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDropdownData(response.data);
    } catch (err) {
      console.error("Error fetching dropdown data:", err.response?.data || err.message);
      toast.error("Gagal memuat data dropdown.");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (
      !addData.nama_barang ||
      !addData.harga_barang ||
      !addData.berat_barang ||
      !addData.status_barang ||
      !addData.id_kategoribarang ||
      !addData.jumlah_barang ||
      !addData.penitip_id ||
      !addData.pegawai_id ||
      !addData.tanggal_mulai ||
      !addData.tanggal_akhir ||
      !addData.tanggal_batas ||
      !addData.image ||
      !addData.image2
    ) {
      toast.error("Semua field wajib diisi kecuali deskripsi barang dan tanggal garansi.");
      return;
    }

    const currentDate = new Date().toISOString().split("T")[0];
    if (
      addData.tanggal_mulai < currentDate ||
      addData.tanggal_akhir < addData.tanggal_mulai ||
      addData.tanggal_batas < addData.tanggal_mulai
    ) {
      toast.error("Tanggal tidak valid.");
      return;
    }

    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("nama_barang", addData.nama_barang);
    formData.append("deskripsi_barang", addData.deskripsi_barang || "");
    formData.append("harga_barang", addData.harga_barang);
    formData.append("berat_barang", addData.berat_barang);
    formData.append("status_barang", addData.status_barang);
    formData.append("tanggal_garansi", addData.tanggal_garansi || "");
    formData.append("id_kategoribarang", addData.id_kategoribarang);
    formData.append("jumlah_barang", addData.jumlah_barang);
    formData.append("penitip_id", addData.penitip_id);
    formData.append("pegawai_id", addData.pegawai_id);
    formData.append("tanggal_mulai", addData.tanggal_mulai);
    formData.append("tanggal_akhir", addData.tanggal_akhir);
    formData.append("tanggal_batas", addData.tanggal_batas);
    formData.append("image", addData.image);
    formData.append("image2", addData.image2);

    try {
      const response = await axios.post(`http://127.0.0.1:8000/api/transaksi-penitipan/add-barang`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Response:", response.data);
      await fetchConsignmentTransactions(token);
      toast.success("Barang dan transaksi penitipan berhasil ditambahkan.");
      setShowAddModal(false);
      setAddData({
        nama_barang: "",
        deskripsi_barang: "",
        harga_barang: "",
        berat_barang: "",
        status_barang: "aktif",
        tanggal_garansi: "",
        id_kategoribarang: "",
        jumlah_barang: "1",
        penitip_id: "",
        pegawai_id: "",
        tanggal_mulai: "",
        tanggal_akhir: "",
        tanggal_batas: "",
        image: null,
        image2: null,
      });
    } catch (err) {
      console.error("Error adding barang and transaction:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Gagal menambahkan barang dan transaksi.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (
      !editData.tanggal_mulai_penitipan ||
      !editData.tanggal_akhir_penitipan ||
      !editData.tanggal_batas_penitipan ||
      !editData.penitip_id_penitipan ||
      !editData.pegawai_id_penitipan ||
      !editData.status_penitipan
    ) {
      toast.error("Semua field wajib diisi kecuali tanggal diperpanjang dan gambar.");
      return;
    }

    const currentDate = new Date().toISOString().split("T")[0];
    if (
      editData.tanggal_mulai_penitipan < currentDate ||
      editData.tanggal_akhir_penitipan < editData.tanggal_mulai_penitipan ||
      editData.tanggal_batas_penitipan < editData.tanggal_mulai_penitipan
    ) {
      toast.error("Tanggal tidak valid.");
      return;
    }

    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("tanggal_mulai_penitipan", editData.tanggal_mulai_penitipan);
    formData.append("tanggal_akhir_penitipan", editData.tanggal_akhir_penitipan);
    formData.append("tanggal_diperpanjang", editData.tanggal_diperpanjang || "");
    formData.append("status_penitipan", editData.status_penitipan);
    formData.append("tanggal_batas_penitipan", editData.tanggal_batas_penitipan);
    formData.append("penitip_id_penitipan", editData.penitip_id_penitipan);
    formData.append("pegawai_id_penitipan", editData.pegawai_id_penitipan);
    if (editData.image) formData.append("image", editData.image);
    if (editData.image2) formData.append("image2", editData.image2);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/transaksi-penitipan/${selectedTransaction.id_penitipan_transaksi}/update`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      await fetchConsignmentTransactions(token, searchQuery);
      toast.success(response.data.message || "Transaksi dan gambar barang titipan berhasil diperbarui.");
      setShowEditModal(false);
      setSelectedTransaction(null);
      setEditData({
        tanggal_mulai_penitipan: "",
        tanggal_akhir_penitipan: "",
        tanggal_diperpanjang: "",
        status_penitipan: "",
        tanggal_batas_penitipan: "",
        penitip_id_penitipan: "",
        pegawai_id_penitipan: "",
        image: null,
        image2: null,
      });
    } catch (err) {
      console.error("Error updating transaction:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Gagal memperbarui transaksi.");
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddData({
      nama_barang: "",
      deskripsi_barang: "",
      harga_barang: "",
      berat_barang: "",
      status_barang: "aktif",
      tanggal_garansi: "",
      id_kategoribarang: "",
      jumlah_barang: "1",
      penitip_id: "",
      pegawai_id: "",
      tanggal_mulai: "",
      tanggal_akhir: "",
      tanggal_batas: "",
      image: null,
      image2: null,
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedTransaction(null);
    setEditData({
      tanggal_mulai_penitipan: "",
      tanggal_akhir_penitipan: "",
      tanggal_diperpanjang: "",
      status_penitipan: "",
      tanggal_batas_penitipan: "",
      penitip_id_penitipan: "",
      pegawai_id_penitipan: "",
      image: null,
      image2: null,
    });
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedBarang(null);
  };

  const handleUpdateToDonasi = async (idBarang) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/barang/${idBarang}/status`,
        { status_barang: "untuk_donasi" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        toast.success("Status barang berhasil diubah menjadi untuk donasi.");
        await fetchBarangList(token); // Refresh daftar barang
      }
    } catch (err) {
      console.error("Error updating to donasi:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Gagal mengubah status barang.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const employeeId = localStorage.getItem("id_pegawai");
    const userRole = localStorage.getItem("userRole");

    if (!token || !employeeId || userRole !== "pegawaiGudang") {
      navigate("/generalLogin");
      toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const tanggalAkhirDate = new Date();
    tanggalAkhirDate.setDate(new Date().getDate() + 30);
    const tanggalAkhir = tanggalAkhirDate.toISOString().split("T")[0];
    const tanggalBatasDate = new Date(tanggalAkhirDate);
    tanggalBatasDate.setDate(tanggalAkhirDate.getDate() + 7);
    const tanggalBatas = tanggalBatasDate.toISOString().split("T")[0];

    setAddData((prev) => ({
      ...prev,
      status_barang: "aktif",
      jumlah_barang: "1",
      pegawai_id: employeeId,
      tanggal_mulai: today,
      tanggal_akhir: tanggalAkhir,
      tanggal_batas: tanggalBatas,
    }));

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      await fetchEmployeeProfile(token, employeeId);
      await fetchConsignmentTransactions(token);
      await fetchBarangList(token);
      await fetchDropdownData(token);
      await fetchConsignedItems(token); // Fetch data barang dititipkan
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="warehouse-loading-state">Memuat Dashboard...</div>;
  if (error) return <div className="warehouse-error-state">Error: {error}</div>;

  const indexOfLastItem = currentItemsPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredTransactions = consignmentTransactions.filter((transaction) => {
    if (!transaction) return false;
    const searchLower = searchQuery.toLowerCase();
    const detail = transaction.detail_transaksi_penitipans?.[0];
    const namaBarang = detail?.barang?.nama_barang?.toLowerCase() || "";
    const jumlahBarang = detail?.jumlah_barang_penitip?.toString() || "";
    return (
      transaction.id_penitipan_transaksi?.toString().includes(searchQuery) ||
      namaBarang.includes(searchLower) ||
      jumlahBarang.includes(searchQuery) ||
      transaction.tanggal_mulai_penitipan?.includes(searchQuery) ||
      transaction.tanggal_akhir_penitipan?.includes(searchQuery) ||
      transaction.status_penitipan?.toLowerCase().includes(searchLower) ||
      transaction.penitip?.nama_penitip?.toLowerCase().includes(searchLower) ||
      transaction.pegawai?.nama_pegawai?.toLowerCase().includes(searchLower)
    );
  });
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalItemsPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const indexOfLastBarang = currentBarangPage * itemsPerPage;
  const indexOfFirstBarang = indexOfLastBarang - itemsPerPage;
  const currentBarang = barangList.slice(indexOfFirstBarang, indexOfLastBarang);
  const totalBarangPages = Math.ceil(barangList.length / itemsPerPage);

  const indexOfLastConsigned = currentConsignedPage * itemsPerPage;
  const indexOfFirstConsigned = indexOfLastConsigned - itemsPerPage;
  const currentConsignedItems = consignedItems.slice(indexOfFirstConsigned, indexOfLastConsigned);
  const totalConsignedPages = Math.ceil(consignedItems.length / itemsPerPage);

  const paginateItems = (pageNumber) => setCurrentItemsPage(pageNumber);
  const nextItemsPage = () => {
    if (currentItemsPage < totalItemsPages) setCurrentItemsPage(currentItemsPage + 1);
  };
  const prevItemsPage = () => {
    if (currentItemsPage > 1) setCurrentItemsPage(currentItemsPage - 1);
  };

  const paginateBarang = (pageNumber) => setCurrentBarangPage(pageNumber);
  const nextBarangPage = () => {
    if (currentBarangPage < totalBarangPages) setCurrentBarangPage(currentBarangPage + 1);
  };
  const prevBarangPage = () => {
    if (currentBarangPage > 1) setCurrentBarangPage(currentBarangPage - 1);
  };

  const paginateConsigned = (pageNumber) => setCurrentConsignedPage(pageNumber);
  const nextConsignedPage = () => {
    if (currentConsignedPage < totalConsignedPages) setCurrentConsignedPage(currentConsignedPage + 1);
  };
  const prevConsignedPage = () => {
    if (currentConsignedPage > 1) setCurrentConsignedPage(currentConsignedPage - 1);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentItemsPage(1);
  };

  const handleAddTransaction = () => {
    setShowAddModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditData({
      tanggal_mulai_penitipan: transaction.tanggal_mulai_penitipan || "",
      tanggal_akhir_penitipan: transaction.tanggal_akhir_penitipan || "",
      tanggal_diperpanjang: transaction.tanggal_diperpanjang || "",
      status_penitipan: transaction.status_penitipan || "",
      tanggal_batas_penitipan: transaction.tanggal_batas_penitipan || "",
      penitip_id_penitipan: transaction.penitip_id_penitipan || "",
      pegawai_id_penitipan: transaction.pegawai_id_penitipan || "",
      image: null,
      image2: null,
    });
    setShowEditModal(true);
  };

  const handleViewBarangDetail = (id) => {
    const token = localStorage.getItem("authToken");
    fetchBarangDetail(token, id);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className="warehouse-dashboard-section">
            <h3>Profil Anda</h3>
            {employeeProfile ? (
              <table className="warehouse-profile-table">
                <tbody>
                  <tr><td><strong>ID</strong></td><td>{employeeProfile.id_pegawai}</td></tr>
                  <tr><td><strong>Nama</strong></td><td>{employeeProfile.nama_pegawai}</td></tr>
                  <tr><td><strong>Email</strong></td><td>{employeeProfile.email_pegawai}</td></tr>
                  <tr><td><strong>Jabatan</strong></td><td>{employeeProfile.jabatan?.nama_jabatan || "Tidak Diketahui"}</td></tr>
                </tbody>
              </table>
            ) : (
              <p>Profil tidak dapat dimuat.</p>
            )}
          </div>
        );
      case "items":
        return (
          <div className="warehouse-dashboard-section">
            <h3>Daftar Transaksi Barang Titipan</h3>
            <div className="warehouse-search-bar">
              <input
                type="text"
                placeholder="Cari berdasarkan ID transaksi..."
                value={searchQuery}
                onChange={handleSearch}
                className="warehouse-search-input"
              />
              <button onClick={handleAddTransaction} className="warehouse-add-btn">
                Tambah Barang
              </button>
            </div>
            {filteredTransactions.length > 0 ? (
              <>
                <table className="warehouse-transaction-table">
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>Nama Barang</th>
                      <th>Jumlah</th>
                      <th>Tanggal Mulai</th>
                      <th>Tanggal Akhir</th>
                      <th>Status</th>
                      <th>Penitip</th>
                      <th>Pegawai</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map((transaction) => {
                      const detail = transaction.detail_transaksi_penitipans && transaction.detail_transaksi_penitipans.length > 0 ? transaction.detail_transaksi_penitipans[0] : null;
                      return (
                        <tr key={transaction.id_penitipan_transaksi || Math.random()}>
                          <td>{transaction.id_penitipan_transaksi || "N/A"}</td>
                          <td>{detail?.barang?.nama_barang || "Tidak Diketahui"}</td>
                          <td>{detail?.jumlah_barang_penitip || 0}</td>
                          <td>{formatDate(transaction.tanggal_mulai_penitipan)}</td>
                          <td>{formatDate(transaction.tanggal_akhir_penitipan)}</td>
                          <td>{transaction.status_penitipan || "Tidak Diketahui"}</td>
                          <td>{transaction.penitip?.nama_penitip || "Tidak Diketahui"}</td>
                          <td>{transaction.pegawai?.nama_pegawai || "Tidak Diketahui"}</td>
                          <td>
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="warehouse-edit-btn"
                              disabled={!transaction.id_penitipan_transaksi}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => window.open(`/print-nota/${transaction.id_penitipan_transaksi}`, "_blank")}
                              className="warehouse-print-btn"
                              style={{ marginLeft: "10px" }}
                            >
                              Cetak Nota
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="warehouse-pagination">
                  <button
                    className="warehouse-paginate-btn"
                    onClick={prevItemsPage}
                    disabled={currentItemsPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalItemsPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      className={`warehouse-paginate-btn ${currentItemsPage === number ? "warehouse-active" : ""}`}
                      onClick={() => paginateItems(number)}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    className="warehouse-paginate-btn"
                    onClick={nextItemsPage}
                    disabled={currentItemsPage === totalItemsPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p>Tidak ada transaksi barang titipan yang ditemukan.</p>
            )}
          </div>
        );
      case "barang":
        return (
          <div className="warehouse-dashboard-section">
            <h3>Daftar Barang Titipan</h3>
            {barangList.length > 0 ? (
              <>
                <table className="warehouse-transaction-table">
                  <thead>
                    <tr>
                      <th>ID Barang</th>
                      <th>Nama Barang</th>
                      <th>Kategori</th>
                      <th>Harga (Rp)</th>
                      <th>Berat (kg)</th>
                      <th>Tanggal Akhir</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBarang.map((barang) => {
                      const today = new Date();
                      const hasExpired = barang.detail_transaksi_penitipans?.some((detail) => {
                        if (!detail?.transaksi_penitipan?.tanggal_batas_penitipan) return false;
                        const tanggalBatas = new Date(detail.transaksi_penitipan.tanggal_batas_penitipan);
                        return tanggalBatas < today;
                      });

                      const hasDonated = () => barang.status_barang === "untuk_donasi";

                      return (
                        <tr key={barang.id_barang || Math.random()}>
                          <td>{barang.id_barang || "N/A"}</td>
                          <td>{barang.nama_barang || "Tidak Diketahui"}</td>
                          <td>{barang.kategori_barang?.nama_kategori || "Tidak Diketahui"}</td>
                          <td>{barang.harga_barang || 0}</td>
                          <td>{barang.berat_barang || 0}</td>
                          <td>
                            {barang.detail_transaksi_penitipans?.[0]?.transaksi_penitipan?.tanggal_batas_penitipan
                              ? formatDate(barang.detail_transaksi_penitipans[0].transaksi_penitipan.tanggal_batas_penitipan)
                              : "Tidak Diketahui"}
                          </td>
                          <td>
                            <button
                              onClick={() => handleViewBarangDetail(barang.id_barang)}
                              className="warehouse-detail-btn"
                            >
                              Detail
                            </button>
                            {hasExpired && !hasDonated() && (
                              <button
                                onClick={() => handleUpdateToDonasi(barang.id_barang)}
                                className="warehouse-donasi-btn"
                                style={{ marginLeft: "10px" }}
                              >
                                Ubah ke untuk Donasi
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="warehouse-pagination">
                  <button
                    className="warehouse-paginate-btn"
                    onClick={prevBarangPage}
                    disabled={currentBarangPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalBarangPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      className={`warehouse-paginate-btn ${currentBarangPage === number ? "warehouse-active" : ""}`}
                      onClick={() => paginateBarang(number)}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    className="warehouse-paginate-btn"
                    onClick={nextBarangPage}
                    disabled={currentBarangPage === totalBarangPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p>Tidak ada barang titipan yang ditemukan.</p>
            )}
          </div>
        );
      case "consignedItems":
        return (
          <div className="warehouse-dashboard-section">
            <h3>Daftar Barang Dititipkan oleh Penitip</h3> 
            {consignedItems.length > 0 ? (
              <>
                <table className="warehouse-transaction-table">
                  <thead>
                    <tr>
                      <th>Nama Barang</th>
                      <th>Tanggal Titip</th>
                      <th>Nama Penitip</th>
                      <th>Status Barang</th>
                      <th>Harga Barang (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentConsignedItems.map((item) => (
                      <tr key={item.id_barang || Math.random()}>
                        <td>{item.nama_barang || "Tidak Diketahui"}</td>
                        <td>{formatDate(item.detail_transaksi_penitipans?.[0]?.transaksi_penitipan?.tanggal_mulai_penitipan) || "Tidak Diketahui"}</td>
                        <td>{item.detail_transaksi_penitipans?.[0]?.transaksi_penitipan?.penitip?.nama_penitip || "Tidak Diketahui"}</td>
                        <td>{item.status_barang || "Tidak Diketahui"}</td>
                        <td>{item.harga_barang || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="warehouse-pagination">
                  <button
                    className="warehouse-paginate-btn"
                    onClick={prevConsignedPage}
                    disabled={currentConsignedPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalConsignedPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      className={`warehouse-paginate-btn ${currentConsignedPage === number ? "warehouse-active" : ""}`}
                      onClick={() => paginateConsigned(number)}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    className="warehouse-paginate-btn"
                    onClick={nextConsignedPage}
                    disabled={currentConsignedPage === totalConsignedPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p>Tidak ada barang yang dititipkan dalam 1 bulan terakhir.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="warehouse-dashboard">
      <aside className="warehouse-sidebar">
        <div className="warehouse-sidebar-logo">REUSEMART GUDANG</div>
        <nav className="warehouse-sidebar-nav">
          <ul>
            <li
              className={activeMenu === "dashboard" ? "warehouse-active" : ""}
              onClick={() => setActiveMenu("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={activeMenu === "items" ? "warehouse-active" : ""}
              onClick={() => setActiveMenu("items")}
            >
              Daftar Transaksi Barang Titipan
            </li>
            <li
              className={activeMenu === "barang" ? "warehouse-active" : ""}
              onClick={() => setActiveMenu("barang")}
            >
              Daftar Barang Titipan
            </li>
            <li
              className={activeMenu === "consignedItems" ? "warehouse-active" : ""}
              onClick={() => setActiveMenu("consignedItems")}
            >
              Daftar Barang Dititipkan oleh Penitip
            </li>
            <li onClick={handleLogout} className="warehouse-logout-btn">
              Logout
            </li>
          </ul>
        </nav>
      </aside>

      <main className="warehouse-dashboard-container">
        <h2>
          {activeMenu === "dashboard"
            ? "Dashboard Pegawai Gudang"
            : activeMenu === "items"
            ? "Daftar Transaksi Barang Titipan"
            : activeMenu === "barang"
            ? "Daftar Barang Titipan"
            : "Daftar Barang Dititipkan oleh Penitip"}
        </h2>
        <p className="warehouse-welcome-text">
          Selamat datang, {employeeProfile?.nama_pegawai || "Pegawai Gudang"}
        </p>
        {renderContent()}

        {showAddModal && (
          <div className="warehouse-modal">
            <div className="warehouse-modal-content">
              <div className="warehouse-modal-header">
                <h3>Tambah Barang Baru</h3>
                <button className="warehouse-close-btn" onClick={handleCloseAddModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="warehouse-form-group">
                  <label htmlFor="nama_barang">Nama Barang:</label>
                  <input
                    type="text"
                    id="nama_barang"
                    value={addData.nama_barang}
                    onChange={(e) => setAddData({ ...addData, nama_barang: e.target.value })}
                    required
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="deskripsi_barang">Deskripsi Barang:</label>
                  <textarea
                    id="deskripsi_barang"
                    value={addData.deskripsi_barang}
                    onChange={(e) => setAddData({ ...addData, deskripsi_barang: e.target.value })}
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="harga_barang">Harga Barang (Rp):</label>
                  <input
                    type="number"
                    id="harga_barang"
                    value={addData.harga_barang}
                    onChange={(e) => setAddData({ ...addData, harga_barang: e.target.value })}
                    required
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="berat_barang">Berat Barang (kg):</label>
                  <input
                    type="number"
                    id="berat_barang"
                    value={addData.berat_barang}
                    onChange={(e) => setAddData({ ...addData, berat_barang: e.target.value })}
                    required
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="status_barang">Status Barang:</label>
                  <input
                    type="text"
                    id="status_barang"
                    value={addData.status_barang}
                    readOnly
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="tanggal_garansi">Tanggal Garansi:</label>
                  <input
                    type="date"
                    id="tanggal_garansi"
                    value={addData.tanggal_garansi}
                    onChange={(e) => setAddData({ ...addData, tanggal_garansi: e.target.value })}
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="id_kategoribarang">Kategori Barang:</label>
                  <select
                    id="id_kategoribarang"
                    value={addData.id_kategoribarang}
                    onChange={(e) => setAddData({ ...addData, id_kategoribarang: e.target.value })}
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {dropdownData.kategoriBarangs.map((kategori) => (
                      <option key={kategori.id_kategori} value={kategori.id_kategori}>
                        {kategori.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="jumlah_barang">Jumlah Barang:</label>
                  <input
                    type="number"
                    id="jumlah_barang"
                    value={addData.jumlah_barang}
                    readOnly
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="penitip_id">Penitip:</label>
                  <select
                    id="penitip_id"
                    value={addData.penitip_id}
                    onChange={(e) => setAddData({ ...addData, penitip_id: e.target.value })}
                    required
                  >
                    <option value="">Pilih Penitip</option>
                    {dropdownData.penitips.map((penitip) => (
                      <option key={penitip.id_penitip} value={penitip.id_penitip}>
                        {penitip.nama_penitip}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="pegawai_id">Pegawai:</label>
                  <input
                    type="text"
                    id="pegawai_id"
                    value={employeeProfile?.nama_pegawai || "Memuat..."}
                    readOnly
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="tanggal_mulai">Tanggal Mulai:</label>
                  <input
                    type="date"
                    id="tanggal_mulai"
                    value={addData.tanggal_mulai}
                    readOnly
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="tanggal_akhir">Tanggal Akhir:</label>
                  <input
                    type="date"
                    id="tanggal_akhir"
                    value={addData.tanggal_akhir}
                    readOnly
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="tanggal_batas">Tanggal Batas:</label>
                  <input
                    type="date"
                    id="tanggal_batas"
                    value={addData.tanggal_batas}
                    readOnly
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="image">Gambar 1:</label>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={(e) => setAddData({ ...addData, image: e.target.files[0] })}
                    required
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="image2">Gambar 2:</label>
                  <input
                    type="file"
                    id="image2"
                    accept="image/*"
                    onChange={(e) => setAddData({ ...addData, image2: e.target.files[0] })}
                    required
                  />
                </div>
                <div className="warehouse-modal-actions">
                  <button type="submit" className="warehouse-submit-btn">
                    <i className="fas fa-save"></i> Tambah
                  </button>
                  <button type="button" className="warehouse-cancel-btn" onClick={handleCloseAddModal}>
                    <i className="fas fa-times"></i> Tutup
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedTransaction && (
          <div className="warehouse-modal">
            <div className="warehouse-modal-content">
              <div className="warehouse-modal-header">
                <h3>Edit Transaksi Barang Titipan (ID: {selectedTransaction.id_penitipan_transaksi})</h3>
                <button className="warehouse-close-btn" onClick={handleCloseEditModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_tanggal_mulai_penitipan">Tanggal Mulai:</label>
                  <input
                    type="date"
                    id="edit_tanggal_mulai_penitipan"
                    value={formatDate(editData.tanggal_mulai_penitipan)}
                    onChange={(e) => setEditData({ ...editData, tanggal_mulai_penitipan: e.target.value })}
                    required
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_tanggal_akhir_penitipan">Tanggal Akhir:</label>
                  <input
                    type="date"
                    id="edit_tanggal_akhir_penitipan"
                    value={formatDate(editData.tanggal_akhir_penitipan)}
                    onChange={(e) => setEditData({ ...editData, tanggal_akhir_penitipan: e.target.value })}
                    required
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_tanggal_diperpanjang">Tanggal Diperpanjang:</label>
                  <input
                    type="date"
                    id="edit_tanggal_diperpanjang"
                    value={formatDate(editData.tanggal_diperpanjang)}
                    onChange={(e) => setEditData({ ...editData, tanggal_diperpanjang: e.target.value })}
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_status_penitipan">Status:</label>
                  <select
                    id="edit_status_penitipan"
                    value={editData.status_penitipan}
                    onChange={(e) => setEditData({ ...editData, status_penitipan: e.target.value })}
                    required
                  >
                    <option value="aktif">Aktif</option>
                    <option value="diambil_kembali">Diambil Kembali</option>
                    <option value="didonasikan">Didonasikan</option>
                    <option value="kadaluarsa">Kadaluarsa</option>
                    <option value="terjual">Terjual</option>
                  </select>
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_tanggal_batas_penitipan">Tanggal Batas:</label>
                  <input
                    type="date"
                    id="edit_tanggal_batas_penitipan"
                    value={formatDate(editData.tanggal_batas_penitipan)}
                    onChange={(e) => setEditData({ ...editData, tanggal_batas_penitipan: e.target.value })}
                    required
                  />
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_penitip_id_penitipan">Penitip:</label>
                  <select
                    id="edit_penitip_id_penitipan"
                    value={editData.penitip_id_penitipan}
                    onChange={(e) => setEditData({ ...editData, penitip_id_penitipan: e.target.value })}
                    required
                  >
                    <option value="">Pilih Penitip</option>
                    {dropdownData.penitips.map((penitip) => (
                      <option key={penitip.id_penitip} value={penitip.id_penitip}>
                        {penitip.nama_penitip}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_pegawai_id_penitipan">Pegawai:</label>
                  <select
                    id="edit_pegawai_id_penitipan"
                    value={editData.pegawai_id_penitipan}
                    onChange={(e) => setEditData({ ...editData, pegawai_id_penitipan: e.target.value })}
                    required
                  >
                    <option value="">Pilih Pegawai</option>
                    {dropdownData.pegawais.map((pegawai) => (
                      <option key={pegawai.id_pegawai} value={pegawai.id_pegawai}>
                        {pegawai.nama_pegawai}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="warehouse-form-group">
                  <label>Gambar 1 Saat Ini:</label>
                  {selectedTransaction.detail_transaksi_penitipans && selectedTransaction.detail_transaksi_penitipans.length > 0 ? (
                    <div>
                      {selectedTransaction.detail_transaksi_penitipans[0].barang?.image ? (
                        <img
                          src={`http://127.0.0.1:8000/images/${selectedTransaction.detail_transaksi_penitipans[0].barang.image}`}
                          alt="Gambar 1 Saat Ini"
                          className="warehouse-image-preview"
                          style={{ maxWidth: "200px", maxHeight: "200px" }}
                          onError={(e) => console.log("Error loading image:", e)}
                        />
                      ) : (
                        <p>Tidak ada gambar.</p>
                      )}
                    </div>
                  ) : (
                    <p>Tidak ada detail transaksi.</p>
                  )}
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_image">Gambar 1 Baru (opsional):</label>
                  <input
                    type="file"
                    id="edit_image"
                    accept="image/*"
                    onChange={(e) => setEditData({ ...editData, image: e.target.files[0] })}
                  />
                </div>
                <div className="warehouse-form-group">
                  <label>Gambar 2 Saat Ini:</label>
                  {selectedTransaction.detail_transaksi_penitipans && selectedTransaction.detail_transaksi_penitipans.length > 0 ? (
                    <div>
                      {selectedTransaction.detail_transaksi_penitipans[0].barang?.image2 ? (
                        <img
                          src={`http://127.0.0.1:8000/images/${selectedTransaction.detail_transaksi_penitipans[0].barang.image2}`}
                          alt="Gambar 2 Saat Ini"
                          className="warehouse-image-preview"
                          style={{ maxWidth: "200px", maxHeight: "200px" }}
                          onError={(e) => console.log("Error loading image:", e)}
                        />
                      ) : (
                        <p>Tidak ada gambar.</p>
                      )}
                    </div>
                  ) : (
                    <p>Tidak ada detail transaksi.</p>
                  )}
                </div>
                <div className="warehouse-form-group">
                  <label htmlFor="edit_image2">Gambar 2 Baru (opsional):</label>
                  <input
                    type="file"
                    id="edit_image2"
                    accept="image/*"
                    onChange={(e) => setEditData({ ...editData, image2: e.target.files[0] })}
                  />
                </div>
                <div className="warehouse-modal-actions">
                  <button type="submit" className="warehouse-submit-btn">
                    <i className="fas fa-save"></i> Simpan
                  </button>
                  <button type="button" className="warehouse-cancel-btn" onClick={handleCloseEditModal}>
                    <i className="fas fa-times"></i> Tutup
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDetailModal && selectedBarang && (
          <div className="warehouse-modal">
            <div className="warehouse-modal-content">
              <div className="warehouse-modal-header">
                <h3>Detail Barang Titipan (ID: {selectedBarang.id_barang})</h3>
                <button className="warehouse-close-btn" onClick={handleCloseDetailModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="warehouse-modal-body">
                <div className="warehouse-form-group">
                  <label><strong>Nama Barang:</strong></label>
                  <p>{selectedBarang.nama_barang || "Tidak Diketahui"}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Deskripsi:</strong></label>
                  <p>{selectedBarang.deskripsi_barang || "Tidak Ada Deskripsi"}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Harga (Rp):</strong></label>
                  <p>{selectedBarang.harga_barang || 0}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Berat (kg):</strong></label>
                  <p>{selectedBarang.berat_barang || 0}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Status:</strong></label>
                  <p>{selectedBarang.status_barang || "Tidak Diketahui"}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Masa Penitipan Tenggat (Hari):</strong></label>
                  <p>{selectedBarang.masa_penitipan_tenggat || "Tidak Diketahui"}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Tanggal Garansi:</strong></label>
                  <p>{formatDate(selectedBarang.tanggal_garansi) || "Tidak Ada Garansi"}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Kategori:</strong></label>
                  <p>{selectedBarang.kategori_barang?.nama_kategori || "Tidak Diketahui"}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Penitip:</strong></label>
                  <p>{selectedBarang.penitip?.nama_penitip || "Tidak Diketahui"}</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Rating Penitip:</strong></label>
                  <p>{selectedBarang.average_penitip_rating || 0} / 5</p>
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Gambar 1:</strong></label>
                  {selectedBarang.image ? (
                    <img
                      src={`http://127.0.0.1:8000/images/${selectedBarang.image}`}
                      alt="Gambar 1"
                      className="warehouse-image-preview"
                      style={{ maxWidth: "200px", maxHeight: "200px" }}
                      onError={(e) => console.log("Error loading image 1:", e)}
                    />
                  ) : (
                    <p>Tidak ada gambar.</p>
                  )}
                </div>
                <div className="warehouse-form-group">
                  <label><strong>Gambar 2:</strong></label>
                  {selectedBarang.image2 ? (
                    <img
                      src={`http://127.0.0.1:8000/images/${selectedBarang.image2}`}
                      alt="Gambar 2"
                      className="warehouse-image-preview"
                      style={{ maxWidth: "200px", maxHeight: "200px" }}
                      onError={(e) => console.log("Error loading image 2:", e)}
                    />
                  ) : (
                    <p>Tidak ada gambar.</p>
                  )}
                </div>
              </div>
              <div className="warehouse-modal-actions">
                <button type="button" className="warehouse-cancel-btn" onClick={handleCloseDetailModal}>
                  <i className="fas fa-times"></i> Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPegawaiGudang;