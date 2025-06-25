/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react"; // Tambahkan useCallback
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import "./dashboardOwner.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import html2pdf from "html2pdf.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const DashboardOwner = () => {
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [unfulfilledDonationRequests, setUnfulfilledDonationRequests] = useState([]);
    const [donationHistory, setDonationHistory] = useState([]);
    const [donatedItemsReport, setDonatedItemsReport] = useState([]);
    const [itemsForDonation, setItemsForDonation] = useState([]);
    const [userRoleState, setUserRoleState] = useState(null);
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [currentRequestsPage, setCurrentRequestsPage] = useState(1);
    const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
    const [isLoadingSales, setIsLoadingSales] = useState(false);
    const [monthlySales, setMonthlySales] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [stockData, setStockData] = useState([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [commissionData, setCommissionData] = useState([]);
    const [isLoadingCommission, setIsLoadingCommission] = useState(false);
    const [isLoadingDonatedItemsReport, setIsLoadingDonatedItemsReport] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [kurirAssignedItems, setKurirAssignedItems] = useState([]); // State dari Code 1
    const [isLoadingKurirAssignedItems, setIsLoadingKurirAssignedItems] = useState(false); // State dari Code 1
    
    // --- State baru untuk laporan penitip ---
    const [penitips, setPenitips] = useState([]);
    const [selectedPenitipId, setSelectedPenitipId] = useState('');
    const [penitipReportData, setPenitipReportData] = useState(null);
    const [isLoadingPenitipReport, setIsLoadingPenitipReport] = useState(false);
    const [penitipReportYear, setPenitipReportYear] = useState(new Date().getFullYear());
    const [penitipReportMonth, setPenitipReportMonth] = useState(new Date().getMonth() + 1);
    const [availablePenitipReportYears, setAvailablePenitipReportYears] = useState([]);
    // --- Akhir state baru ---

    const itemsPerPage = 7;
    const reportRef = useRef(null);

    const [allocationData, setAllocationData] = useState({
        barang_id_donasi: "",
        tanggal_donasi: "",
        nama_penerima: "",
    });
    const [editData, setEditData] = useState({
        tanggal_donasi: "",
        nama_penerima: "",
        status_barang: "",
    });

    const navigate = useNavigate();

    // Fetch penitip list for dropdown
    useEffect(() => {
        const fetchPenitips = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) return;
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/penitip`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPenitips(Array.isArray(response.data) ? response.data : []);
                // Set default selected penitip if available
                if (response.data.length > 0) {
                    setSelectedPenitipId(response.data[0].id_penitip);
                }
            } catch (error) {
                console.error("Error fetching penitips:", error);
                toast.error("Gagal memuat daftar penitip.");
            }
        };

        if (activeMenu === "laporanPenitip") {
            fetchPenitips();
        }
    }, [activeMenu]);

    // Fetch report data for selected penitip, year, month
    const fetchPenitipReport = useCallback(async () => {
        if (!selectedPenitipId || !penitipReportYear || !penitipReportMonth) {
            setPenitipReportData(null);
            return;
        }

        setIsLoadingPenitipReport(true);
        const token = localStorage.getItem("authToken");
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/penitip/report`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    penitip_id: selectedPenitipId,
                    year: penitipReportYear,
                    month: penitipReportMonth
                }
            });
            setPenitipReportData(response.data);
        } catch (error) {
            console.error("Error fetching penitip report:", error.response?.data || error.message);
            toast.error("Gagal memuat laporan penitip: " + (error.response?.data?.message || error.message));
            setPenitipReportData(null);
        } finally {
            setIsLoadingPenitipReport(false);
        }
    }, [selectedPenitipId, penitipReportYear, penitipReportMonth]);

    useEffect(() => {
        if (activeMenu === "laporanPenitip") {
            fetchPenitipReport();
        }
    }, [activeMenu, fetchPenitipReport]);


    // Fetch all other data at the top level
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const id_pegawai = localStorage.getItem("id_pegawai");
        const role = localStorage.getItem("userRole");

        setUserRoleState(role);

        if (!token || role !== "owner") {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
            return;
        }

        const fetchData = async () => {
            try {
                const profileResponse = await axios.get(
                    `http://127.0.0.1:8000/api/pegawai/${id_pegawai}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setOwnerProfile(profileResponse.data || {});

                const unfulfilledDonationRequestsResponse = await axios.get(
                    `http://127.0.0.1:8000/api/request-donasi/unfulfilled`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUnfulfilledDonationRequests(Array.isArray(unfulfilledDonationRequestsResponse.data) ? unfulfilledDonationRequestsResponse.data : []);

                const donationHistoryResponse = await axios.get(
                    `http://127.0.0.1:8000/api/donasi/history`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setDonationHistory(Array.isArray(donationHistoryResponse.data) ? donationHistoryResponse.data : []);

                setIsLoadingDonatedItemsReport(true);
                const donatedItemsReportResponse = await axios.get(
                    `http://127.0.0.1:8000/api/donasi/report`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setDonatedItemsReport(Array.isArray(donatedItemsReportResponse.data) ? donatedItemsReportResponse.data : []);
                setIsLoadingDonatedItemsReport(false);

                const itemsForDonationResponse = await axios.get(
                    `http://127.0.0.1:8000/api/barang/donated`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setItemsForDonation(Array.isArray(itemsForDonationResponse.data) ? itemsForDonationResponse.data : []);

                const yearsResponse = await axios.get(
                    `http://127.0.0.1:8000/api/transaksi-pembelian/years`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const years = yearsResponse.data || [];
                setAvailableYears(years.length > 0 ? years : [new Date().getFullYear()]);

                if (availablePenitipReportYears.length === 0) {
                    setAvailablePenitipReportYears(years.length > 0 ? years : [new Date().getFullYear()]);
                    setPenitipReportYear(years.length > 0 ? years[0] : new Date().getFullYear());
                }

                setIsLoadingSales(true);
                const salesResponse = await axios.get(
                    `http://127.0.0.1:8000/api/transaksi-pembelian/monthly-report?year=${selectedYear}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const salesData = Array.isArray(salesResponse.data) ? salesResponse.data : [];
                const fullYearData = Array.from({ length: 12 }, (_, index) => {
                    const monthIndex = index + 1;
                    const monthStr = monthIndex < 10 ? `0${monthIndex}` : String(monthIndex);
                    const monthData = salesData.find((sale) => sale.month === `${selectedYear}-${monthStr}`);
                    return {
                        month: `${selectedYear}-${monthStr}`,
                        total_sales: monthData ? monthData.total_sales : 0,
                        transaction_count: monthData ? monthData.transaction_count : 0,
                    };
                });
                setMonthlySales(fullYearData);

                // --- FETCH DATA BARU: Laporan Tugas Kurir (dari Code 1) ---
                setIsLoadingKurirAssignedItems(true);
                const kurirAssignedItemsResponse = await axios.get(
                    `http://127.0.0.1:8000/api/owner/courier-assigned-items`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setKurirAssignedItems(Array.isArray(kurirAssignedItemsResponse.data) ? kurirAssignedItemsResponse.data : []);
                setIsLoadingKurirAssignedItems(false);

                const today = new Date().toISOString().split('T')[0];
                setIsLoadingStock(true);
                const stockResponse = await axios.get(
                    `http://127.0.0.1:8000/api/transaksi-penitipan/stock?date=${today}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setStockData(Array.isArray(stockResponse.data) ? stockResponse.data : []);

                if (activeMenu === "laporanKomisi") {
                    setIsLoadingCommission(true);
                    const commissionResponse = await axios.get(
                        `http://127.0.0.1:8000/api/transaksi-pembelian/komisi-bulanan?year=${selectedYear}&month=${selectedMonth}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setCommissionData(Array.isArray(commissionResponse.data) ? commissionResponse.data : []);
                    setIsLoadingCommission(false);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                toast.error("Gagal memuat data: " + (err.response?.data?.message || err.message));
                setOwnerProfile({});
                setUnfulfilledDonationRequests([]);
                setDonationHistory([]);
                setDonatedItemsReport([]);
                setItemsForDonation([]);
                setMonthlySales(Array.from({ length: 12 }, (_, index) => ({
                    month: `${new Date().getFullYear()}-${index + 1 < 10 ? `0${index + 1}` : String(index + 1)}`,
                    total_sales: 0,
                    transaction_count: 0,
                })));
                setAvailableYears([new Date().getFullYear()]);
                setStockData([]);
                setCommissionData([]);
                setKurirAssignedItems([]); // Reset state jika error
                setPenitips([]);
                setPenitipReportData(null);
            } finally {
                setIsLoadingSales(false);
                setIsLoadingStock(false);
                setIsLoadingDonatedItemsReport(false);
                setIsLoadingKurirAssignedItems(false); // Reset loading state
                setIsLoadingPenitipReport(false);
            }
        };

        fetchData();
    }, [navigate, selectedYear, selectedMonth, activeMenu]);

    const handleAllocateDonation = async (request) => {
        if (!request || !request.id_request_donasi) {
            toast.error("Request tidak valid.");
            return;
        }
        setSelectedRequest(request);
        setAllocationData({
            barang_id_donasi: "",
            tanggal_donasi: "",
            nama_penerima: "",
        });
        setShowAllocationModal(true);
    };

    const handleDownloadKurirAssignedItemsPDF = () => {
        window.scrollTo(0, 0); 
        const element = reportRef.current; 
        const today = new Date();
        const formattedToday = today.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, ''); // Format DDMMYYYY
        const options = {
            margin: 10,
            filename: `laporan-tugas-pengiriman-kurir-${formattedToday}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, logging: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }, 
        };

        html2pdf().set(options).from(element).save().then(() => {
            toast.success("Laporan tugas pengiriman kurir berhasil diunduh.");
        }).catch((error) => {
            console.error("Error generating Kurir Assigned Items PDF:", error);
            toast.error("Gagal mengunduh laporan tugas pengiriman kurir PDF.");
        });
    };

    const handleEditDonation = (history) => {
        if (!history || !history.id_donasi) {
            toast.error("History donasi tidak valid.");
            return;
        }
        setSelectedHistory(history);
        setEditData({
            tanggal_donasi: history.tanggal_donasi || "",
            nama_penerima: history.nama_penerima || "",
            status_barang: history.barang?.status_barang || "didonasikan",
        });
        setShowEditModal(true);
    };

    const handleAllocationSubmit = async (e) => {
        e.preventDefault();
        if (!allocationData.barang_id_donasi) {
            toast.error("Pilih barang untuk didonasikan.");
            return;
        }
        if (!allocationData.tanggal_donasi) {
            toast.error("Tanggal donasi tidak boleh kosong.");
            return;
        }
        if (!allocationData.nama_penerima.trim()) {
            toast.error("Nama penerima donasi tidak boleh kosong.");
            return;
        }
        const currentDate = new Date().toISOString().split("T")[0];
        if (allocationData.tanggal_donasi < currentDate) {
            toast.error("Tanggal donasi tidak boleh sebelum hari ini.");
            return;
        }
        const token = localStorage.getItem("authToken");
        const id_pegawai = localStorage.getItem("id_pegawai");
        try {
            const selectedItem = itemsForDonation.find(
                (item) => item.id_barang === parseInt(allocationData.barang_id_donasi)
            );
            if (!selectedItem) {
                toast.error("Barang yang dipilih tidak ditemukan.");
                return;
            }
            const updatePayload = {
                status_barang: "didonasikan",
                nama_barang: selectedItem.nama_barang,
                harga_barang: selectedItem.harga_barang,
                berat_barang: selectedItem.berat_barang,
                masa_penitipan_tenggat: selectedItem.masa_penitipan_tenggat,
                id_kategoribarang: selectedItem.id_kategoribarang,
                deskripsi_barang: selectedItem.deskripsi_barang,
                tanggal_garansi: selectedItem.tanggal_garansi,
            };
            await axios.put(
                `http://127.0.0.1:8000/api/barang/${allocationData.barang_id_donasi}`,
                updatePayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const donasiPayload = {
                tanggal_donasi: allocationData.tanggal_donasi,
                nama_penerima: allocationData.nama_penerima,
                request_donasi_id: selectedRequest.id_request_donasi,
                barang_id_donasi: allocationData.barang_id_donasi,
                pegawai_id_donasi: id_pegawai,
                id_organisasi: selectedRequest.organisasi_id,
            };
            await axios.post(`http://127.0.0.1:8000/api/donasi`, donasiPayload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItemsForDonation(
                itemsForDonation.filter(
                    (item) => item.id_barang !== parseInt(allocationData.barang_id_donasi)
                )
            );
            setUnfulfilledDonationRequests(
                unfulfilledDonationRequests.filter(
                    (req) => req.id_request_donasi !== selectedRequest.id_request_donasi
                )
            );
            const updatedDonationHistoryResponse = await axios.get(
                `http://127.0.0.1:8000/api/donasi/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDonationHistory(Array.isArray(updatedDonationHistoryResponse.data) ? updatedDonationHistoryResponse.data : []);
            const refreshDonatedItemsReport = await axios.get(
                `http://127.0.0.1:8000/api/donasi/report`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDonatedItemsReport(Array.isArray(refreshDonatedItemsReport.data) ? refreshDonatedItemsReport.data : []);

            toast.success("Donasi berhasil dialokasikan.");
            setShowAllocationModal(false);
            setSelectedRequest(null);
        } catch (err) {
            console.error("Error allocating donation:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal mengalokasikan donasi.");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editData.tanggal_donasi) {
            toast.error("Tanggal donasi tidak boleh kosong.");
            return;
        }
        if (!editData.nama_penerima.trim()) {
            toast.error("Nama penerima donasi tidak boleh kosong.");
            return;
        }
        const currentDate = new Date().toISOString().split("T")[0];
        if (editData.tanggal_donasi < currentDate) {
            toast.error("Tanggal donasi tidak boleh sebelum hari ini.");
            return;
        }
        const token = localStorage.getItem("authToken");
        try {
            const updateBarangPayload = {
                status_barang: editData.status_barang,
                nama_barang: selectedHistory.barang?.nama_barang || "",
                harga_barang: selectedHistory.barang?.harga_barang || 0,
                berat_barang: selectedHistory.barang?.berat_barang || 0,
                masa_penitipan_tenggat: selectedHistory.barang?.masa_penitipan_tenggat || null,
                id_kategoribarang: selectedHistory.barang?.id_kategoribarang || null,
                deskripsi_barang: selectedHistory.barang?.deskripsi_barang || "",
                tanggal_garansi: selectedHistory.barang?.tanggal_garansi || null,
            };
            await axios.put(
                `http://127.0.0.1:8000/api/barang/${selectedHistory.barang_id_donasi}`,
                updateBarangPayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updateDonasiPayload = {
                tanggal_donasi: editData.tanggal_donasi,
                nama_penerima: editData.nama_penerima,
                request_donasi_id: selectedHistory.request_donasi_id,
                barang_id_donasi: selectedHistory.barang_id_donasi,
                pegawai_id_donasi: selectedHistory.pegawai_id_donasi,
                id_organisasi: selectedHistory.id_organisasi,
            };
            await axios.put(
                `http://127.0.0.1:8000/api/donasi/${selectedHistory.id_donasi}`,
                updateDonasiPayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedDonationHistoryResponse = await axios.get(
                `http://127.0.0.1:8000/api/donasi/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDonationHistory(Array.isArray(updatedDonationHistoryResponse.data) ? updatedDonationHistoryResponse.data : []);
            const refreshDonatedItemsReport = await axios.get(
                `http://127.0.0.1:8000/api/donasi/report`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDonatedItemsReport(Array.isArray(refreshDonatedItemsReport.data) ? refreshDonatedItemsReport.data : []);

            toast.success("Donasi berhasil diperbarui.");
            setShowEditModal(false);
            setSelectedHistory(null);
            setCurrentHistoryPage(1);
        } catch (err) {
            console.error("Error updating donation:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal memperbarui donasi.");
        }
    };

    const handleCloseAllocationModal = () => {
        setShowAllocationModal(false);
        setSelectedRequest(null);
        setAllocationData({
            barang_id_donasi: "",
            tanggal_donasi: "",
            nama_penerima: "",
        });
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedHistory(null);
        setEditData({
            tanggal_donasi: "",
            nama_penerima: "",
            status_barang: "",
        });
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

    const indexOfLastRequest = currentRequestsPage * itemsPerPage;
    const indexOfFirstRequest = indexOfLastRequest - itemsPerPage;
    const currentRequests = unfulfilledDonationRequests.slice(indexOfFirstRequest, indexOfLastRequest);
    const totalRequestsPages = Math.ceil(unfulfilledDonationRequests.length / itemsPerPage);

    const paginateRequests = (pageNumber) => setCurrentRequestsPage(pageNumber);
    const nextRequestsPage = () => {
        if (currentRequestsPage < totalRequestsPages) setCurrentRequestsPage(currentRequestsPage + 1);
    };
    const prevRequestsPage = () => {
        if (currentRequestsPage > 1) setCurrentRequestsPage(currentRequestsPage - 1);
    };

    const indexOfLastHistory = currentHistoryPage * itemsPerPage;
    const indexOfFirstHistory = indexOfLastHistory - itemsPerPage;
    const currentHistory = donationHistory.slice(indexOfFirstHistory, indexOfLastHistory);
    const totalHistoryPages = Math.ceil(donationHistory.length / itemsPerPage);

    const paginateHistory = (pageNumber) => setCurrentHistoryPage(pageNumber);
    const nextHistoryPage = () => {
        if (currentHistoryPage < totalHistoryPages) setCurrentHistoryPage(currentHistoryPage + 1);
    };
    const prevHistoryPage = () => {
        if (currentHistoryPage > 1) setCurrentHistoryPage(currentHistoryPage - 1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return "---";
        }
        return date.toISOString().split('T')[0];
    };

    const getFormattedPrintDate = () => {
        const today = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        return today.toLocaleDateString('id-ID', options);
    };

    const handleDownloadStockPDF = () => {
        window.scrollTo(0, 0);
        const element = reportRef.current;
        // Sembunyikan tombol sebelum rendering (dari Code 2)
        const downloadButtons = element.getElementsByClassName("owner-download-btn");
        for (let button of downloadButtons) {
            button.style.display = "none";
        }
        const today = new Date().toISOString().split('T')[0];
        const opt = {
            margin: 10,
            filename: `laporan-stok-gudang-${today}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, logging: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        };
        html2pdf().set(opt).from(element).save().then(() => {
            console.log("PDF generated successfully");
            // Kembalikan tombol setelah rendering selesai
            for (let button of downloadButtons) {
                button.style.display = "";
            }
        }).catch((error) => {
            console.error("Error generating PDF:", error);
            // Kembalikan tombol jika ada error
            for (let button of downloadButtons) {
                button.style.display = "";
            }
        });
    };

    const handleDownloadCommissionPDF = () => {
        window.scrollTo(0, 0);
        const element = reportRef.current;
        // Sembunyikan tombol sebelum rendering (dari Code 2)
        const downloadButtons = element.getElementsByClassName("owner-download-btn");
        for (let button of downloadButtons) {
            button.style.display = "none";
        }
        const opt = {
            margin: 10,
            filename: `laporan-komisi-bulanan-${selectedMonth}-${selectedYear}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, logging: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        };
        html2pdf().set(opt).from(element).save().then(() => {
            console.log("PDF generated successfully");
            // Kembalikan tombol setelah rendering selesai
            for (let button of downloadButtons) {
                button.style.display = "";
            }
        }).catch((error) => {
            console.error("Error generating PDF:", error);
            // Kembalikan tombol jika ada error
            for (let button of downloadButtons) {
                button.style.display = "";
            }
        });
    };

    const handleDownloadUnfulfilledRequestsPDF = () => {
        window.scrollTo(0, 0);
        const element = reportRef.current;
        const today = new Date().toISOString().split('T')[0];
        const opt = {
            margin: 10,
            filename: `laporan-request-donasi-belum-terpenuhi-${today}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, logging: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };
        html2pdf().set(opt).from(element).save().then(() => {
            console.log("PDF generated successfully");
        }).catch((error) => {
            console.error("Error generating PDF:", error);
        });
    };

    const handleDownloadDonatedItemsReportPDF = () => {
        window.scrollTo(0, 0);
        const element = reportRef.current;
        const today = new Date().toISOString().split('T')[0];
        const opt = {
            margin: 10,
            filename: `laporan-donasi-barang-${today}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, logging: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        };
        html2pdf().set(opt).from(element).save().then(() => {
            console.log("Donated items report PDF generated successfully");
        }).catch((error) => {
            console.error("Error generating Donated items report PDF:", error);
        });
    };

    const handleDownloadPenitipReportPDF = () => {
        window.scrollTo(0, 0);
        const element = reportRef.current;
        const today = new Date().toISOString().split('T')[0];
        const monthNames = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const selectedMonthName = monthNames[penitipReportMonth - 1];

        const opt = {
            margin: 10,
            filename: `laporan-penitip-${penitipReportData?.nama_penitip || 'unknown'}-${selectedMonthName}-${penitipReportYear}-${today}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, logging: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        };
        html2pdf().set(opt).from(element).save().then(() => {
            console.log("Penitip report PDF generated successfully");
        }).catch((error) => {
            console.error("Error generating Penitip report PDF:", error);
        });
    };

    const renderContent = () => {
        const monthNames = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        switch (activeMenu) {
            case "dashboard":
                return (
                    <div className="owner-dashboard-section">
                        <h3>Profil Owner</h3>
                        {ownerProfile ? (
                            <div className="owner-profile-details">
                                <p><strong>ID:</strong> {ownerProfile.id_pegawai || "Tidak Diketahui"}</p>
                                <p><strong>Nama:</strong> {ownerProfile.nama_pegawai || "Tidak Diketahui"}</p>
                                <p><strong>Email:</strong> {ownerProfile.email_pegawai || "Tidak Diketahui"}</p>
                                <p><strong>Jabatan:</strong> {ownerProfile.jabatan?.nama_jabatan || "Tidak Ada"}</p>
                                <p><strong>Role Sistem:</strong> {userRoleState || "Tidak Diketahui"}</p>
                            </div>
                        ) : (
                            <p>Memuat profil...</p>
                        )}
                    </div>
                );
            case "laporanRequestDonasi":
                return (
                    <div className="owner-dashboard-section" ref={reportRef}>
                        <div style={{
                            marginBottom: "20px",
                            textAlign: "center",
                            display: "block",
                            position: "relative",
                            padding: "10px",
                            border: "1px solid #000",
                            color: "#000",
                            fontFamily: "Arial, Helvetica, sans-serif",
                            fontSize: "14px"
                        }}>
                            <h2 style={{ margin: "0", color: "#000" }}>ReUse Mart</h2>
                            <p style={{ margin: "5px 0", color: "#000" }}>Jl. Green Eco Park No. 456 Yogyakarta</p>
                            <h3 style={{ margin: "0", color: "#000" }}>LAPORAN REQUEST DONASI BELUM TERPENUHI</h3>
                            <p style={{ margin: "5px 0", color: "#000" }}><strong>Tanggal cetak:</strong> {getFormattedPrintDate()}</p>
                        </div>
                        <h3>Daftar Request Donasi yang Belum Terpenuhi</h3>
                        {unfulfilledDonationRequests.length > 0 ? (
                            <>
                                <table className="owner-donation-table" style={{ width: "100%", borderCollapse: "collapse", color: "#000" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#4CAF50" }}>
                                            <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>ID Organisasi</th>
                                            <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Organisasi</th>
                                            <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Alamat Organisasi</th>
                                            <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Request Barang Donasi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unfulfilledDonationRequests.map((request) => (
                                            <tr key={request.id_request_donasi || Math.random()} style={{ border: "1px solid #bfbfbf" }}>
                                                <td style={{ padding: "10px" }}>{request.organisasi?.id_organisasi || "---"}</td>
                                                <td style={{ padding: "10px" }}>{request.organisasi?.nama_organisasi || "Tidak Diketahui"}</td>
                                                <td style={{ padding: "10px" }}>{request.alamat_req_donasi || "Tidak Diketahui"}</td>
                                                <td style={{ padding: "10px" }}>{request.request_barang_donasi || "Tidak Diketahui"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button className="owner-download-btn" onClick={handleDownloadUnfulfilledRequestsPDF} disabled={unfulfilledDonationRequests.length === 0}>
                                    <i className="fas fa-download"></i> Unduh PDF Laporan Request Donasi
                                </button>
                            </>
                        ) : (
                            <p>Tidak ada request donasi yang belum terpenuhi saat ini.</p>
                        )}
                    </div>
                );
            case "laporanDonasiBarang":
                return (
                    <div className="owner-dashboard-section" ref={reportRef}>
                        <div style={{
                            marginBottom: "20px",
                            textAlign: "center",
                            display: "block",
                            position: "relative",
                            padding: "10px",
                            border: "1px solid #000",
                            color: "#000",
                            fontFamily: "Arial, Helvetica, sans-serif",
                            fontSize: "14px"
                        }}>
                            <h2 style={{ margin: "0", color: "#000" }}>ReUse Mart</h2>
                            <p style={{ margin: "5px 0", color: "#000" }}>Jl. Green Eco Park No. 456 Yogyakarta</p>
                            <h3 style={{ margin: "0", color: "#000" }}>LAPORAN DONASI BARANG</h3>
                            <p style={{ margin: "5px 0", color: "#000" }}><strong>Tanggal cetak:</strong> {getFormattedPrintDate()}</p>
                        </div>
                        <h3>Daftar Barang yang Telah Didonasikan</h3>
                        {isLoadingDonatedItemsReport ? (
                            <p>Memuat data laporan donasi barang...</p>
                        ) : (
                            donatedItemsReport.length > 0 ? (
                                <>
                                    <table className="owner-donation-table" style={{ width: "100%", borderCollapse: "collapse", color: "#000" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#4CAF50" }}>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>ID Barang</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Produk</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>ID Penitip</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Penitip</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Tanggal Donasi</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Organisasi</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Penerima</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {donatedItemsReport.map((item, index) => (
                                                <tr key={index} style={{ border: "1px solid #bfbfbf" }}>
                                                    <td style={{ padding: "10px" }}>{item.id_barang}</td>
                                                    <td style={{ padding: "10px" }}>{item.nama_produk}</td>
                                                    <td style={{ padding: "10px" }}>{item.id_penitip}</td>
                                                    <td style={{ padding: "10px" }}>{item.nama_penitip}</td>
                                                    <td style={{ padding: "10px" }}>{formatDate(item.tanggal_donasi)}</td>
                                                    <td style={{ padding: "10px" }}>{item.nama_organisasi}</td>
                                                    <td style={{ padding: "10px" }}>{item.nama_penerima}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button className="owner-download-btn" onClick={handleDownloadDonatedItemsReportPDF} disabled={donatedItemsReport.length === 0}>
                                        <i className="fas fa-download"></i> Unduh PDF Laporan Donasi Barang
                                    </button>
                                </>
                            ) : (
                                <p>Tidak ada barang yang telah didonasikan.</p>
                            )
                        )}
                    </div>
                );
            case "laporanPenitip":
                return (
                    <div className="owner-dashboard-section" ref={reportRef}>
                        <div style={{
                            marginBottom: "20px",
                            textAlign: "center",
                            display: "block",
                            position: "relative",
                            padding: "10px",
                            border: "1px solid #000",
                            color: "#000",
                            fontFamily: "Arial, Helvetica, sans-serif",
                            fontSize: "14px"
                        }}>
                            <h2 style={{ margin: "0", color: "#000" }}>ReUse Mart</h2>
                            <p style={{ margin: "5px 0", color: "#000" }}>Jl. Green Eco Park No. 456 Yogyakarta</p>
                            <h3 style={{ margin: "0", color: "#000" }}>LAPORAN TRANSAKSI PENITIP</h3>
                            {penitipReportData && (
                                <>
                                    <p style={{ margin: "5px 0", color: "#000" }}>
                                        <strong>ID Penitip:</strong> {penitipReportData.penitip_id}
                                    </p>
                                    <p style={{ margin: "5px 0", color: "#000" }}>
                                        <strong>Nama Penitip:</strong> {penitipReportData.nama_penitip}
                                    </p>
                                    <p style={{ margin: "5px 0", color: "#000" }}>
                                        <strong>Bulan:</strong> {monthNames[penitipReportMonth - 1]}
                                    </p>
                                    <p style={{ margin: "5px 0", color: "#000" }}>
                                        <strong>Tahun:</strong> {penitipReportYear}
                                    </p>
                                </>
                            )}
                            <p style={{ margin: "5px 0", color: "#000" }}><strong>Tanggal cetak:</strong> {getFormattedPrintDate()}</p>
                        </div>
                        <div style={{ marginBottom: "20px" }}>
                            <label htmlFor="penitipSelect">Pilih Penitip: </label>
                            <select
                                id="penitipSelect"
                                value={selectedPenitipId}
                                onChange={(e) => setSelectedPenitipId(e.target.value)}
                                style={{ padding: "5px", marginLeft: "10px", marginRight: "20px" }}
                                disabled={isLoadingPenitipReport}
                            >
                                <option value="">Pilih Penitip</option>
                                {penitips.map(penitip => (
                                    <option key={penitip.id_penitip} value={penitip.id_penitip}>
                                        {penitip.nama_penitip} (ID: {penitip.id_penitip})
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="penitipReportMonthSelect">Pilih Bulan: </label>
                            <select
                                id="penitipReportMonthSelect"
                                value={penitipReportMonth}
                                onChange={(e) => setPenitipReportMonth(parseInt(e.target.value))}
                                style={{ padding: "5px", marginLeft: "10px", marginRight: "20px" }}
                                disabled={isLoadingPenitipReport}
                            >
                                {monthNames.map((month, index) => (
                                    <option key={index + 1} value={index + 1}>
                                        {month}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="penitipReportYearSelect">Pilih Tahun: </label>
                            <select
                                id="penitipReportYearSelect"
                                value={penitipReportYear}
                                onChange={(e) => setPenitipReportYear(parseInt(e.target.value))}
                                style={{ padding: "5px", marginLeft: "10px" }}
                                disabled={isLoadingPenitipReport}
                            >
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isLoadingPenitipReport ? (
                            <p>Memuat laporan transaksi penitip...</p>
                        ) : (
                            penitipReportData && penitipReportData.detail_transaksi.length > 0 ? (
                                <>
                                    <div style={{ minHeight: "200px", marginBottom: "20px" }}>
                                        <table className="owner-donation-table" style={{ width: "100%", borderCollapse: "collapse", color: "#000" }}>
                                            <thead>
                                                <tr style={{ backgroundColor: "#4CAF50" }}>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Kode Produk</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Produk</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Tanggal Masuk</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Tanggal Laku</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Harga Jual Bersih</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Bonus Terjual Cepat</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Pendapatan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {penitipReportData.detail_transaksi.map((item, index) => (
                                                    <tr key={index} style={{ border: "1px solid #bfbfbf" }}>
                                                        <td style={{ padding: "10px" }}>{item.id_barang}</td>
                                                        <td style={{ padding: "10px" }}>{item.nama_produk}</td>
                                                        <td style={{ padding: "10px" }}>{item.tanggal_masuk}</td>
                                                        <td style={{ padding: "10px" }}>{item.tanggal_laku}</td>
                                                        <td style={{ padding: "10px" }}>Rp. {item.harga_jual_bersih?.toLocaleString("id-ID") || "0"}</td>
                                                        <td style={{ padding: "10px" }}>Rp. {item.bonus_terjual_cepat?.toLocaleString("id-ID") || "0"}</td>
                                                        <td style={{ padding: "10px" }}>Rp. {item.pendapatan?.toLocaleString("id-ID") || "0"}</td>
                                                    </tr>
                                                ))}
                                                <tr style={{ border: "1px solid #bfbfbf", fontWeight: "bold" }}>
                                                    <td style={{ padding: "10px" }} colSpan="4">Total</td>
                                                    <td style={{ padding: "10px" }}>Rp. {penitipReportData.total_harga_jual_bersih?.toLocaleString("id-ID") || "0"}</td>
                                                    <td style={{ padding: "10px" }}>Rp. {penitipReportData.total_bonus_terjual_cepat?.toLocaleString("id-ID") || "0"}</td>
                                                    <td style={{ padding: "10px" }}>Rp. {penitipReportData.total_pendapatan?.toLocaleString("id-ID") || "0"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <button className="owner-download-btn" onClick={handleDownloadPenitipReportPDF} disabled={!penitipReportData || penitipReportData.detail_transaksi.length === 0}>
                                        <i className="fas fa-download"></i> Unduh PDF Laporan Penitip
                                    </button>
                                </>
                            ) : (
                                <p>Tidak ada transaksi terjual untuk penitip ini pada bulan dan tahun yang dipilih.</p>
                            )
                        )}
                    </div>
                );

            case "requests":
                return (
                    <div className="owner-dashboard-section">
                        <h3>Daftar Request Donasi (Belum Dialokasikan)</h3>
                        <p>Permintaan donasi yang belum dialokasikan ke barang:</p>
                        {unfulfilledDonationRequests.length > 0 ? (
                            <>
                                <table className="owner-donation-table">
                                    <thead>
                                        <tr>
                                            <th>Permintaan</th>
                                            <th>Alamat</th>
                                            <th>Organisasi</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRequests.map((request) => (
                                            <tr key={request.id_request_donasi || Math.random()}>
                                                <td>{request.request_barang_donasi || "Tidak Diketahui"}</td>
                                                <td>{request.alamat_req_donasi || "Tidak Diketahui"}</td>
                                                <td>{request.organisasi?.nama_organisasi || "Tidak Diketahui"}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleAllocateDonation(request)}
                                                        className="owner-allocate-btn"
                                                        disabled={!request.id_request_donasi}
                                                    >
                                                        Alokasi Donasi
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="owner-pagination">
                                    <button
                                        className="owner-paginate-btn"
                                        onClick={prevRequestsPage}
                                        disabled={currentRequestsPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalRequestsPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            className={`owner-paginate-btn ${currentRequestsPage === number ? "owner-active" : ""}`}
                                            onClick={() => paginateRequests(number)}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        className="owner-paginate-btn"
                                        onClick={nextRequestsPage}
                                        disabled={currentRequestsPage === totalRequestsPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>Tidak ada request donasi yang perlu dialokasikan saat ini.</p>
                        )}
                    </div>
                );
            case "history":
                return (
                    <div className="owner-dashboard-section">
                        <h3>History Donasi</h3>
                        <p>Riwayat donasi ke organisasi:</p>
                        {donationHistory.length > 0 ? (
                            <>
                                <table className="owner-donation-table">
                                    <thead>
                                        <tr>
                                            <th>Barang</th>
                                            <th>Organisasi</th>
                                            <th>Tanggal Donasi</th>
                                            <th>Penerima</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentHistory.map((history) => (
                                            <tr key={history.id_donasi || Math.random()}>
                                                <td>{history.barang?.nama_barang || "Tidak Diketahui"}</td>
                                                <td>
                                                    {history.request_donasi?.organisasi?.nama_organisasi ||
                                                        history.organisasi?.nama_organisasi ||
                                                        "Tidak Diketahui"}
                                                </td>
                                                <td>{history.tanggal_donasi || "Tidak Diketahui"}</td>
                                                <td>{history.nama_penerima || "Tidak Diketahui"}</td>
                                                <td>{history.barang?.status_barang || "Tidak Diketahui"}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleEditDonation(history)}
                                                        className="owner-edit-btn"
                                                        disabled={!history.id_donasi}
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="owner-pagination">
                                    <button
                                        className="owner-paginate-btn"
                                        onClick={prevHistoryPage}
                                        disabled={currentHistoryPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            className={`owner-paginate-btn ${currentHistoryPage === number ? "owner-active" : ""}`}
                                            onClick={() => paginateHistory(number)}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        className="owner-paginate-btn"
                                        onClick={nextHistoryPage}
                                        disabled={currentHistoryPage === totalHistoryPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>Belum ada riwayat donasi.</p>
                        )}
                    </div>
                );
            case "laporanPenjualan":
                {
                    const chartData = {
                        labels: monthlySales.map((_, index) => monthNames[index]),
                        datasets: [
                            {
                                label: "Total Penjualan (Rp)",
                                data: monthlySales.map((sale) => sale.total_sales || 0),
                                backgroundColor: "rgba(75, 192, 192, 0.6)",
                                borderColor: "rgba(75, 192, 192, 1)",
                                borderWidth: 1,
                            },
                        ],
                    };
                    const chartOptions = {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: "top" },
                            title: { display: true, text: `Grafik Laporan Penjualan Bulanan Tahun ${selectedYear}` },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: { display: true, text: "Total Penjualan (Rp)" },
                            },
                            x: {
                                title: { display: true, text: "Bulan" },
                            },
                        },
                    };
                    const handleDownloadPDF = () => {
                        window.scrollTo(0, 0);
                        const element = reportRef.current;
                        const downloadButtons = element.getElementsByClassName("owner-download-btn");
                        for (let button of downloadButtons) {
                            button.style.display = "none";
                        }
                        const opt = {
                            margin: 10,
                            filename: `laporan-penjualan-bulanan-${selectedYear}-${new Date().toISOString().split('T')[0]}.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 3, useCORS: true, logging: true, letterRendering: true },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
                        };
                        html2pdf().set(opt).from(element).save().then(() => {
                            console.log("PDF generated successfully");
                             for (let button of downloadButtons) {
                                button.style.display = "";
                            }
                        }).catch((error) => {
                            console.error("Error generating PDF:", error);
                             for (let button of downloadButtons) {
                                button.style.display = "";
                            }
                        });
                    };
                    const totalSales = monthlySales.reduce((sum, sale) => sum + (sale.total_sales || 0), 0);
                    const totalTransactions = monthlySales.reduce((sum, sale) => sum + (sale.transaction_count || 0), 0);

                    return (
                        <div className="owner-dashboard-section" ref={reportRef}>
                            <div style={{
                                marginBottom: "20px",
                                textAlign: "center",
                                display: "block",
                                position: "relative",
                                padding: "10px",
                                border: "1px solid #000",
                                color: "#000",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: "14px"
                            }}>
                                <h2 style={{ margin: "0", color: "#000" }}>ReUse Mart</h2>
                                <p style={{ margin: "5px 0", color: "#000" }}>Jl. Green Eco Park No. 456 Yogyakarta</p>
                                <h3 style={{ margin: "0", color: "#000" }}>LAPORAN Penjualan Bulanan</h3>
                                <p style={{ margin: "5px 0", color: "#000" }}><strong>Tanggal cetak:</strong> {getFormattedPrintDate()}</p>
                            </div>
                            <h3>Laporan Penjualan Bulanan Keseluruhan</h3>
                            <div style={{ marginBottom: "20px" }}>
                                <label htmlFor="yearSelect">Pilih Tahun: </label>
                                <select
                                    id="yearSelect"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    style={{ padding: "5px", marginLeft: "10px" }}
                                    disabled={isLoadingSales}
                                >
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {isLoadingSales ? (
                                <p>Memuat data laporan penjualan...</p>
                            ) : monthlySales.length === 0 || monthlySales.every(sale => sale.total_sales === 0 && sale.transaction_count === 0) ? (
                                <p style={{ textAlign: "center", color: "#000" }}>Data tidak ditemukan untuk tahun {selectedYear}.</p>
                            ) : (
                                <>
                                    <div style={{ minHeight: "200px", marginBottom: "20px" }}>
                                        <table className="owner-donation-table" style={{ width: "100%", borderCollapse: "collapse", color: "#000" }}>
                                            <thead>
                                                <tr style={{ backgroundColor: "#4CAF50" }}>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Bulan</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Total Penjualan (Rp)</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Jumlah Transaksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monthlySales.map((sale, index) => (
                                                    <tr key={index} style={{ border: "1px solid #bfbfbf" }}>
                                                        <td style={{ padding: "10px" }}>{monthNames[index]}</td>
                                                        <td style={{ padding: "10px" }}>{sale.total_sales?.toLocaleString("id-ID") || "0"}</td>
                                                        <td style={{ padding: "10px" }}>{sale.transaction_count || "0"}</td>
                                                    </tr>
                                                ))}
                                                 <tr style={{ border: "1px solid #bfbfbf", fontWeight: "bold" }}>
                                                    <td style={{ padding: "10px" }}>Total</td>
                                                    <td style={{ padding: "10px" }}>{totalSales.toLocaleString("id-ID") || "0"}</td>
                                                    <td style={{ padding: "10px" }}>{totalTransactions.toLocaleString("id-ID") || "0"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="owner-chart-container" style={{ height: "500px", width: "100%", marginBottom: "20px" }}>
                                        <Bar data={chartData} options={chartOptions} />
                                    </div>
                                    <button className="owner-download-btn" onClick={handleDownloadPDF} disabled={isLoadingSales}>
                                        <i className="fas fa-download"></i> Unduh PDF
                                    </button>
                                </>
                            )}
                        </div>
                    );
                }
            case "laporanStock":
                return (
                    <div className="owner-dashboard-section" ref={reportRef}>
                        <div style={{
                            marginBottom: "20px",
                            textAlign: "center",
                            display: "block",
                            position: "relative",
                            padding: "10px",
                            border: "1px solid #000",
                            color: "#000",
                            fontFamily: "Arial, Helvetica, sans-serif",
                            fontSize: "14px"
                        }}>
                            <h2 style={{ margin: "0", color: "#000" }}>ReUse Mart</h2>
                            <p style={{ margin: "5px 0", color: "#000" }}>Jl. Green Eco Park No. 456 Yogyakarta</p>
                            <h3 style={{ margin: "0", color: "#000" }}>LAPORAN Stok Gudang</h3>
                            <p style={{ margin: "5px 0", color: "#000" }}><strong>Tanggal cetak:</strong> {getFormattedPrintDate()}</p>
                        </div>
                        {isLoadingStock ? (
                            <p>Memuat data stok gudang...</p>
                        ) : (
                            <>
                                <div style={{ minHeight: "200px", marginBottom: "20px" }}>
                                    <table
                                        className="owner-donation-table"
                                        style={{ width: "100%", borderCollapse: "collapse", color: "#000" }}
                                    >
                                        <thead>
                                            <tr style={{ backgroundColor: "#4CAF50" }}>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Kode Produk</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Produk</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>ID Penitip</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Penitip</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Tanggal Masuk</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Perpanjangan</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>ID Hunter</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Hunter</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Harga</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockData.map((stock, index) => (
                                                <tr key={index} style={{ border: "1px solid #bfbfbf" }}>
                                                    <td style={{ padding: "10px" }}>{stock.kode_produk || "---"}</td>
                                                    <td style={{ padding: "10px" }}>{stock.nama_produk || "---"}</td>
                                                    <td style={{ padding: "10px" }}>{stock.id_penitip || "---"}</td>
                                                    <td style={{ padding: "10px" }}>{stock.nama_penitip || "---"}</td>
                                                    <td style={{ padding: "10px" }}>{formatDate(stock.tanggal_masuk)}</td>
                                                    <td style={{ padding: "10px" }}>{stock.perpanjangan ? "Ya" : "Tidak"}</td>
                                                    <td style={{ padding: "10px" }}>{stock.id_hunter || "---"}</td>
                                                    <td style={{ padding: "10px" }}>{stock.nama_hunter || "---"}</td>
                                                    <td style={{ padding: "10px" }}>{stock.harga?.toLocaleString("id-ID") || "0"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button className="owner-download-btn" onClick={handleDownloadStockPDF} disabled={isLoadingStock || stockData.length === 0}>
                                    <i className="fas fa-download"></i> Unduh PDF
                                </button>
                            </>
                        )}
                    </div>
                );
            case "laporanTugasKurir": 
                return (
                    <div className="owner-dashboard-section" ref={reportRef}>
                        <div style={{
                            marginBottom: "20px",
                            textAlign: "center",
                            display: "block",
                            position: "relative",
                            padding: "10px",
                            border: "1px solid #000",
                            color: "#000",
                            fontFamily: "Arial, Helvetica, sans-serif",
                            fontSize: "14px"
                        }}>
                            <h2 style={{ margin: "0", color: "#000" }}>ReUse Mart</h2>
                            <p style={{ margin: "5px 0", color: "#000" }}>Jl. Green Eco Park No. 456 Yogyakarta</p>
                            <h3 style={{ margin: "0", color: "#000" }}>LAPORAN TUGAS PENGIRIMAN KURIR</h3>
                            <p style={{ margin: "5px 0", color: "#000" }}><strong>Tanggal Cetak:</strong> {getFormattedPrintDate()}</p>
                        </div>

                        <h3>Daftar Tugas Pengiriman Kurir (1 Bulan Terakhir)</h3>
                        {isLoadingKurirAssignedItems ? (
                            <p>Memuat laporan tugas pengiriman kurir...</p>
                        ) : (
                            kurirAssignedItems.length > 0 ? (
                                <>
                                    <table className="owner-donation-table" style={{ width: "100%", borderCollapse: "collapse", color: "#000" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#4CAF50" }}>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Barang</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Tanggal Jadwal Kirim</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Kurir</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Status Barang</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Status Pengiriman</th>
                                                <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Biaya Ongkir (Rp)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {kurirAssignedItems.map((item, index) => (
                                                <tr key={index} style={{ border: "1px solid #bfbfbf" }}>
                                                    <td style={{ padding: "10px" }}>{item.nama_barang || 'N/A'}</td>
                                                    <td style={{ padding: "10px" }}>{formatDate(item.tanggal_pengiriman) || 'N/A'}</td>
                                                    <td style={{ padding: "10px" }}>{item.nama_kurir || 'N/A'}</td>
                                                    <td style={{ padding: "10px" }}>{item.status_barang || 'N/A'}</td>
                                                    <td style={{ padding: "10px" }}>{item.status_pengiriman || 'N/A'}</td>
                                                    <td style={{ padding: "10px" }}>{item.biaya_ongkir?.toLocaleString('id-ID') || '0'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        className="owner-download-btn"
                                        onClick={handleDownloadKurirAssignedItemsPDF}
                                        disabled={kurirAssignedItems.length === 0}
                                    >
                                        <i className="fas fa-download"></i> Unduh PDF Laporan Tugas Kurir
                                    </button>
                                </>
                            ) : (
                                <p>Tidak ada tugas pengiriman kurir yang tersedia dalam 1 bulan terakhir.</p>
                            )
                        )}
                    </div>
                );
            case "laporanKomisi":
                {
                    const totalCommissionReUseMart = commissionData.reduce((sum, item) => sum + (item.komisi_reuse_mart || 0), 0);
                    const totalCommissionHunter = commissionData.reduce((sum, item) => sum + (item.komisi_hunter || 0), 0);
                    const totalBonusPenitip = commissionData.reduce((sum, item) => sum + (item.bonus_penitip || 0), 0);
                    
                    const getLast10Years = () => {
                        const currentYear = new Date().getFullYear();
                        return Array.from({ length: 10 }, (_, index) => currentYear - index);
                    };

                    return (
                        <div className="owner-dashboard-section" ref={reportRef}>
                            <div style={{
                                marginBottom: "20px",
                                textAlign: "center",
                                display: "block",
                                position: "relative",
                                padding: "10px",
                                border: "1px solid #000",
                                color: "#000",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: "14px"
                            }}>
                                <h2 style={{ margin: "0", color: "#000" }}>ReUse Mart</h2>
                                <p style={{ margin: "5px 0", color: "#000" }}>Jl. Green Eco Park No. 456 Yogyakarta</p>
                                <h3 style={{ margin: "0", color: "#000" }}>LAPORAN KOMISI BULANAN</h3>
                                <p style={{ margin: "5px 0", color: "#000" }}><strong>Bulan:</strong> {monthNames[selectedMonth - 1]}</p>
                                <p style={{ margin: "5px 0", color: "#000" }}><strong>Tahun:</strong> {selectedYear}</p>
                                <p style={{ margin: "5px 0", color: "#000" }}><strong>Tanggal cetak:</strong> {getFormattedPrintDate()}</p>
                            </div>
                            <div style={{ marginBottom: "20px" }}>
                                <label htmlFor="monthSelect">Pilih Bulan: </label>
                                <select
                                    id="monthSelect"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    style={{ padding: "5px", marginLeft: "10px" }}
                                    disabled={isLoadingCommission}
                                >
                                    {monthNames.map((month, index) => (
                                        <option key={index + 1} value={index + 1}>
                                            {month}
                                        </option>
                                    ))}
                                </select>
                                <label htmlFor="yearSelect" style={{ marginLeft: "20px" }}>Pilih Tahun: </label>
                                <select
                                    id="yearSelect"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    style={{ padding: "5px", marginLeft: "10px" }}
                                    disabled={isLoadingCommission}
                                >
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {isLoadingCommission ? (
                                <p>Memuat data komisi...</p>
                            ) : commissionData.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#000" }}>Tidak ada data</p>
                            ) : (
                                <>
                                    <div style={{ minHeight: "200px", marginBottom: "20px" }}>
                                        <table
                                            className="owner-donation-table"
                                            style={{ width: "100%", borderCollapse: "collapse", color: "#000" }}
                                        >
                                            <thead>
                                                <tr style={{ backgroundColor: "#4CAF50" }}>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Kode Produk</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Nama Produk</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Harga Jual</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Tanggal Masuk</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Tanggal Laku</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Komisi Hunter</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Komisi ReUse Mart</th>
                                                    <th style={{ border: "1px solid #bfbfbf", padding: "10px" }}>Bonus Penitip</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {commissionData.map((item, index) => (
                                                    <tr key={index} style={{ border: "1px solid #bfbfbf" }}>
                                                        <td style={{ padding: "10px" }}>{item.kode_produk || "---"}</td>
                                                        <td style={{ padding: "10px" }}>{item.nama_produk || "---"}</td>
                                                        <td style={{ padding: "10px" }}>{item.harga_jual?.toLocaleString("id-ID") || "0"}</td>
                                                        <td style={{ padding: "10px" }}>{formatDate(item.tanggal_masuk) || "---"}</td>
                                                        <td style={{ padding: "10px" }}>{formatDate(item.tanggal_laku) || "---"}</td>
                                                        <td style={{ padding: "10px" }}>{item.komisi_hunter?.toLocaleString("id-ID") || "0"}</td>
                                                        <td style={{ padding: "10px" }}>{item.komisi_reuse_mart?.toLocaleString("id-ID") || "0"}</td>
                                                        <td style={{ padding: "10px" }}>{item.bonus_penitip?.toLocaleString("id-ID") || "0"}</td>
                                                    </tr>
                                                ))}
                                                <tr style={{ border: "1px solid #bfbfbf", fontWeight: "bold" }}>
                                                    <td style={{ padding: "10px" }} colSpan="5">Total</td>
                                                    <td style={{ padding: "10px" }}>{totalCommissionHunter.toLocaleString("id-ID") || "0"}</td>
                                                    <td style={{ padding: "10px" }}>{totalCommissionReUseMart.toLocaleString("id-ID") || "0"}</td>
                                                    <td style={{ padding: "10px" }}>{totalBonusPenitip.toLocaleString("id-ID") || "0"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <button className="owner-download-btn" onClick={handleDownloadCommissionPDF} disabled={isLoadingCommission || commissionData.length === 0}>
                                        <i className="fas fa-download"></i> Unduh PDF
                                    </button>
                                </>
                            )}
                        </div>
                    );
                }
            default:
                return null;
        }
    };

    return (
        <div className="owner-dashboard">
            <aside className="owner-sidebar">
                <div className="owner-sidebar-logo">REUSEMART OWNER</div>
                <nav className="owner-sidebar-nav">
                    <ul>
                        <li
                            className={activeMenu === "dashboard" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("dashboard")}
                        >
                            Dashboard
                        </li>
                        <li
                            className={activeMenu === "laporanRequestDonasi" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("laporanRequestDonasi")}
                        >
                            Laporan Request Donasi
                        </li>
                        <li
                            className={activeMenu === "laporanDonasiBarang" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("laporanDonasiBarang")}
                        >
                            Laporan Donasi Barang
                        </li>
                        <li
                            className={activeMenu === "laporanPenitip" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("laporanPenitip")}
                        >
                            Laporan Transaksi Penitip
                        </li>
                        <li
                            className={activeMenu === "requests" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("requests")}
                        >
                            Alokasi Request Donasi
                        </li>
                        <li
                            className={activeMenu === "history" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("history")}
                        >
                            History Donasi
                        </li>
                        <li
                            className={activeMenu === "laporanPenjualan" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("laporanPenjualan")}
                        >
                            Laporan Penjualan
                        </li>
                        <li
                            className={activeMenu === "laporanStock" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("laporanStock")}
                        >
                            Laporan Stock
                        </li>
                        <li
                            className={activeMenu === "laporanKomisi" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("laporanKomisi")}
                        >
                            Komisi Bulanan
                        </li>
                        <li
                            className={activeMenu === "laporanTugasKurir" ? "owner-active" : ""}
                            onClick={() => setActiveMenu("laporanTugasKurir")}
                        >
                            Laporan Tugas Pengiriman Kurir
                        </li>
                        <li onClick={handleLogout} className="owner-logout-btn">
                            Logout
                        </li>
                    </ul>
                </nav>
            </aside>

            <main className="owner-dashboard-container">
                <h2>
                    {activeMenu === "dashboard"
                        ? "Dashboard Owner"
                        : activeMenu === "requests"
                            ? "Daftar Request Donasi (Belum Dialokasikan)"
                            : activeMenu === "laporanRequestDonasi"
                                ? "Laporan Request Donasi Belum Terpenuhi"
                                : activeMenu === "laporanDonasiBarang"
                                    ? "Laporan Donasi Barang"
                                    : activeMenu === "laporanPenitip"
                                        ? "Laporan Transaksi Penitip"
                                        : activeMenu === "laporanTugasKurir"
                                            ? "Laporan Tugas Pengiriman Kurir"
                                            : activeMenu === "history"
                                                ? "History Donasi"
                                                : activeMenu === "laporanPenjualan"
                                                    ? "Laporan Penjualan Bulanan Keseluruhan"
                                                    : activeMenu === "laporanStock"
                                                        ? "Laporan Stok Gudang"
                                                        : activeMenu === "laporanKomisi"
                                                            ? "Laporan Komisi Bulanan"
                                                            : ""}
                </h2>
                <p className="owner-welcome-text">
                    Selamat datang, {ownerProfile?.nama_pegawai || "Owner"}
                </p>
                {renderContent()}

                {showAllocationModal && selectedRequest && (
                    <div className="owner-modal">
                        <div className="owner-modal-content">
                            <div className="owner-modal-header">
                                <h3>Alokasi Donasi untuk Request: {selectedRequest.request_barang_donasi || "Tidak Diketahui"}</h3>
                                <button className="owner-close-btn" onClick={handleCloseAllocationModal}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleAllocationSubmit}>
                                <div className="owner-form-group">
                                    <label htmlFor="barang_id_donasi">
                                        <i className="fas fa-box"></i> Pilih Barang:
                                    </label>
                                    <select
                                        id="barang_id_donasi"
                                        value={allocationData.barang_id_donasi}
                                        onChange={(e) =>
                                            setAllocationData({
                                                ...allocationData,
                                                barang_id_donasi: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">Pilih Barang untuk Didonasikan</option>
                                        {itemsForDonation.map((item) => (
                                            <option key={item.id_barang} value={item.id_barang}>
                                                {item.nama_barang} (Status: {item.status_barang || "Tidak Diketahui"})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="owner-form-group">
                                    <label htmlFor="tanggal_donasi">
                                        <i className="fas fa-calendar-alt"></i> Tanggal Donasi:
                                    </label>
                                    <input
                                        type="date"
                                        id="tanggal_donasi"
                                        value={allocationData.tanggal_donasi}
                                        onChange={(e) =>
                                            setAllocationData({
                                                ...allocationData,
                                                tanggal_donasi: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="owner-form-group">
                                    <label htmlFor="nama_penerima">
                                        <i className="fas fa-user"></i> Nama Penerima:
                                    </label>
                                    <input
                                        type="text"
                                        id="nama_penerima"
                                        placeholder="Nama Penerima Donasi"
                                        value={allocationData.nama_penerima}
                                        onChange={(e) =>
                                            setAllocationData({
                                                ...allocationData,
                                                nama_penerima: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="owner-modal-actions">
                                    <button type="submit" className="owner-submit-btn">
                                        <i className="fas fa-save"></i> Alokasi Donasi
                                    </button>
                                    <button
                                        type="button"
                                        className="owner-cancel-btn"
                                        onClick={handleCloseAllocationModal}
                                    >
                                        <i className="fas fa-times"></i> Tutup
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showEditModal && selectedHistory && (
                    <div className="owner-modal">
                        <div className="owner-modal-content">
                            <div className="owner-modal-header">
                                <h3>Edit Donasi: {selectedHistory.barang?.nama_barang || "Tidak Diketahui"}</h3>
                                <button className="owner-close-btn" onClick={handleCloseEditModal}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit}>
                                <div className="owner-form-group">
                                    <label htmlFor="edit_tanggal_donasi">
                                        <i className="fas fa-calendar-alt"></i> Tanggal Donasi:
                                    </label>
                                    <input
                                        type="date"
                                        id="edit_tanggal_donasi"
                                        value={editData.tanggal_donasi}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                tanggal_donasi: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="owner-form-group">
                                    <label htmlFor="edit_nama_penerima">
                                        <i className="fas fa-user"></i> Nama Penerima:
                                    </label>
                                    <input
                                        type="text"
                                        id="edit_nama_penerima"
                                        placeholder="Nama Penerima Donasi"
                                        value={editData.nama_penerima}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                nama_penerima: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="owner-form-group">
                                    <label htmlFor="edit_status_barang">
                                        <i className="fas fa-box"></i> Status Barang:
                                    </label>
                                    <select
                                        id="edit_status_barang"
                                        value={editData.status_barang}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                status_barang: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="didonasikan">Didonasikan</option>
                                        <option value="untuk_donasi">Untuk Donasi</option>
                                    </select>
                                </div>
                                <div className="owner-modal-actions">
                                    <button type="submit" className="owner-submit-btn">
                                        <i className="fas fa-save"></i> Simpan
                                    </button>
                                    <button
                                        type="button"
                                        className="owner-cancel-btn"
                                        onClick={handleCloseEditModal}
                                    >
                                        <i className="fas fa-times"></i> Tutup
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

export default DashboardOwner;