/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "./dashboardCS.css";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const CSDashboard = () => {
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [penitip, setPenitip] = useState([]);
    const [csProfile, setCSProfile] = useState(null);
    const [allDiscussions, setAllDiscussions] = useState([]);

    // State untuk verifikasi pembayaran
    const [transactionsToVerify, setTransactionsToVerify] = useState([]);
    const [verifyingId, setVerifyingId] = useState(null);

    // BARU: State untuk transaksi yang sudah diproses
    const [processedTransactions, setProcessedTransactions] = useState([]);
    const [showProcessedDetailModal, setShowProcessedDetailModal] = useState(false);
    const [selectedProcessedTransaction, setSelectedProcessedTransaction] = useState(null);

    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyFormData, setReplyFormData] = useState({
        komentar_pegawai: "",
        discussion_id: null,
    });
    const [replyingDiscussion, setReplyingDiscussion] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTermPenitip, setSearchTermPenitip] = useState("");
    const [searchTermDiscussion, setSearchTermDiscussion] = useState("");
    const [searchTermVerification, setSearchTermVerification] = useState("");
    // BARU: State untuk pencarian transaksi yang sudah diproses
    const [searchTermProcessed, setSearchTermProcessed] = useState("");
    const [filterStatusProcessed, setFilterStatusProcessed] = useState(""); // BARU: Filter status untuk transaksi yang sudah diproses


    const [newPenitip, setNewPenitip] = useState({
        nama_penitip: "",
        email_penitip: "",
        password_penitip: "",
        tgl_lahir_penitip: "",
        no_telepon_penitip: "",
        nik_penitip: "",
        foto_ktp_penitip: null,
        rating_penitip: 0,
        pendapatan_penitip: 0,
        bonus_terjual_cepat: 0,
        reward_program_sosial: 0,
    });

    const [editId, setEditId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const [currentPagePenitip, setCurrentPagePenitip] = useState(1);
    const [currentPageDiscussion, setCurrentPageDiscussion] = useState(1);
    const [currentPageVerification, setCurrentPageVerification] = useState(1);
    // BARU: State paginasi untuk transaksi yang sudah diproses
    const [currentPageProcessed, setCurrentPageProcessed] = useState(1);

    const [merchandiseClaims, setMerchandiseClaims] = useState([]);
    const [currentPageMerchandise, setCurrentPageMerchandise] = useState(1);
    const [searchTermMerchandise, setSearchTermMerchandise] = useState("");
    const [filterStatusMerchandise, setFilterStatusMerchandise] = useState("all");
    const [showMerchPickupModal, setShowMerchPickupModal] = useState(false);
    const [selectedMerchClaim, setSelectedMerchClaim] = useState(null);
    const [pickupDate, setPickupDate] = useState("");


    const itemsPerPage = 7;
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const id_pegawai = localStorage.getItem("id_pegawai");
        const userRole = localStorage.getItem("userRole");

        if (!token || !userRole || !["cs", "manager", "admin"].includes(userRole)) {
            navigate("/generalLogin");
            toast.error("Anda tidak memiliki akses ke halaman ini atau sesi berakhir.");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const profileResponse = await axios.get(
                    `http://127.0.0.1:8000/api/pegawai/${id_pegawai}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setCSProfile(profileResponse.data);

                const penitipResponse = await axios.get("http://127.0.0.1:8000/api/penitip", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (Array.isArray(penitipResponse.data)) {
                    setPenitip(penitipResponse.data);
                } else if (penitipResponse.data?.data && Array.isArray(penitipResponse.data.data)) {
                    setPenitip(penitipResponse.data.data);
                } else {
                    console.error("Unexpected data format:", penitipResponse.data);
                    setError("Format data penitip tidak valid");
                }

                await fetchAllDiscussions(token);
                await fetchTransactionsForVerification(token);
                await fetchProcessedTransactions(token);
                await fetchMerchandiseClaims(token);

            } catch (err) {
                console.error("Error fetching initial data:", err);
                setError("Gagal memuat data awal.");
                if (err.response?.status === 401) {
                    handleLogout();
                }
            } finally {
                setLoading(false);
            }
        };

        if (token && userRole && ["cs", "manager", "admin"].includes(userRole)) {
            fetchData();
        }
    }, [navigate]);

    const fetchMerchandiseClaims = async (token, search = "", status = "all") => {
        try {
            const response = await axios.get(
                "http://127.0.0.1:8000/api/merchandise",
                { headers: { Authorization: `Bearer ${token}` }, params: { search, status } }
            );
            setMerchandiseClaims(response.data);
        } catch (err) {
            console.error("Error fetching merchandise claims:", err.response?.data || err.message);
            toast.error("Gagal memuat daftar klaim merchandise.");
            if (err.response?.status === 401) handleLogout();
        }
    };

    const fetchAllDiscussions = async (token, search = "") => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/diskusi-produk", {
                headers: { Authorization: `Bearer ${token}` },
                params: { search },
            });

            console.log("Fetched All Discussions (CS):", response.data);

            if (Array.isArray(response.data)) {
                setAllDiscussions(response.data);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                setAllDiscussions(response.data.data);
            } else {
                console.error("Unexpected discussion data format:", response.data);
                setAllDiscussions([]);
            }
        } catch (err) {
            console.error("Error fetching all discussions:", err.response?.data || err.message);
            toast.error("Gagal memuat daftar diskusi.");
            if (err.response?.status === 401) handleLogout();
        }
    };

    // Fetch transaksi yang perlu diverifikasi
    const fetchTransactionsForVerification = async (token, search = "") => {
        try {
            const response = await axios.get(
                "http://127.0.0.1:8000/api/pegawai/transactions-for-verification",
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { search },
                }
            );
            setTransactionsToVerify(response.data);
        } catch (err) {
            console.error("Error fetching transactions for verification:", err.response?.data || err.message);
            toast.error("Gagal memuat transaksi untuk verifikasi.");
            if (err.response?.status === 401) handleLogout();
        }
    };

    // BARU: Fetch transaksi yang sudah diproses (valid, tidak_valid, dibatalkan)
    const fetchProcessedTransactions = async (token, search = "", status = "") => {
        try {
            const response = await axios.get(
                "http://127.0.0.1:8000/api/cs/processed-transactions", // Rute BARU
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { search, status }, // Tambahkan parameter status
                }
            );
            setProcessedTransactions(response.data);
        } catch (err) {
            console.error("Error fetching processed transactions:", err.response?.data || err.message);
            toast.error("Gagal memuat riwayat transaksi yang sudah diproses.");
            if (err.response?.status === 401) handleLogout();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPenitip({ ...newPenitip, foto_ktp_penitip: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleAddOrUpdatePenitip = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        const url =
            editId !== null
                ? `http://127.0.0.1:8000/api/penitip/${editId}`
                : "http://127.0.0.1:8000/api/penitip";
        const method = editId !== null ? "put" : "post";

        if (editId === null) {
            if (
                !newPenitip.nama_penitip ||
                !newPenitip.email_penitip ||
                !newPenitip.password_penitip ||
                !newPenitip.tgl_lahir_penitip ||
                !newPenitip.no_telepon_penitip ||
                !newPenitip.nik_penitip
            ) {
                alert(
                    "Semua field wajib diisi: Nama, Email, Password, Tanggal Lahir, No Telepon, dan NIK."
                );
                return;
            }
            const nikRegex = /^[0-9]{16}$/;
            if (!nikRegex.test(newPenitip.nik_penitip)) {
                alert("NIK harus terdiri dari 16 digit angka.");
                return;
            }
            const phoneRegex = /^[0-9\+-]+$/;
            if (!phoneRegex.test(newPenitip.no_telepon_penitip)) {
                alert("Nomor telepon hanya boleh berisi angka, tanda +, atau tanda -.");
                return;
            }
        }

        try {
            if (newPenitip.foto_ktp_penitip) {
                const formData = new FormData();
                if (newPenitip.nama_penitip)
                    formData.append("nama_penitip", newPenitip.nama_penitip);
                if (newPenitip.email_penitip)
                    formData.append("email_penitip", newPenitip.email_penitip);
                if (newPenitip.password_penitip)
                    formData.append("password_penitip", newPenitip.password_penitip);
                if (newPenitip.tgl_lahir_penitip)
                    formData.append("tgl_lahir_penitip", newPenitip.tgl_lahir_penitip);
                if (newPenitip.no_telepon_penitip)
                    formData.append("no_telepon_penitip", newPenitip.no_telepon_penitip);
                if (newPenitip.nik_penitip) formData.append("nik_penitip", newPenitip.nik_penitip);
                formData.append("rating_penitip", newPenitip.rating_penitip || 0);
                formData.append("pendapatan_penitip", newPenitip.pendapatan_penitip || 0);
                formData.append("bonus_terjual_cepat", newPenitip.bonus_terjual_cepat || 0);
                formData.append("reward_program_sosial", newPenitip.reward_program_sosial || 0);
                formData.append("foto_ktp_penitip", newPenitip.foto_ktp_penitip);

                console.log("Sending FormData:", Object.fromEntries(formData));

                const response = await axios({
                    method: method,
                    url: url,
                    data: formData,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (editId !== null) {
                    setPenitip(
                        penitip.map((item) =>
                            item.id_penitip === editId ? { ...item, ...response.data } : item
                        )
                    );
                } else {
                    setPenitip([...penitip, response.data]);
                }
            } else {
                const data = {};
                if (newPenitip.nama_penitip) data.nama_penitip = newPenitip.nama_penitip;
                if (newPenitip.email_penitip) data.email_penitip = newPenitip.email_penitip;
                if (newPenitip.password_penitip)
                    data.password_penitip = newPenitip.password_penitip;
                if (newPenitip.tgl_lahir_penitip)
                    data.tgl_lahir_penitip = newPenitip.tgl_lahir_penitip;
                if (newPenitip.no_telepon_penitip)
                    data.no_telepon_penitip = newPenitip.no_telepon_penitip;
                if (newPenitip.nik_penitip) data.nik_penitip = newPenitip.nik_penitip;
                data.rating_penitip = newPenitip.rating_penitip || 0;
                data.pendapatan_penitip = newPenitip.pendapatan_penitip || 0;
                data.bonus_terjual_cepat = newPenitip.bonus_terjual_cepat || 0;
                data.reward_program_sosial = newPenitip.reward_program_sosial || 0;

                console.log("Sending JSON Data:", data);

                const response = await axios({
                    method: method,
                    url: url,
                    data: data,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (editId !== null) {
                    setPenitip(
                        penitip.map((item) =>
                            item.id_penitip === editId ? { ...item, ...response.data } : item
                        )
                    );
                } else {
                    setPenitip([...penitip, response.data]);
                }
            }

            handleCloseModal();
            toast.success(editId !== null ? "Data penitip diperbarui" : "Penitip baru ditambahkan");
        } catch (err) {
            console.error("Error Adding/Updating Penitip:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || "Terjadi kesalahan";
            const errorDetails = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(", ")
                : err.message;
            toast.error(
                `Gagal menambahkan/memperbarui data penitip: ${errorMessage}. Detail: ${errorDetails}`
            );
        }
    };

    const handleDeletePenitip = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus penitip ini?")) {
            return;
        }

        const token = localStorage.getItem("authToken");
        try {
            await axios.delete(`http://127.0.0.1:8000/api/penitip/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPenitip(penitip.filter((emp) => emp.id_penitip !== id));
            toast.success("Penitip berhasil dihapus");
        } catch (err) {
            console.error("Error Deleting Penitip:", err);
            toast.error("Gagal menghapus penitip. Silakan coba lagi.");
        }
    };

    const handleEditPenitip = (id) => {
        const penitipToEdit = penitip.find((p) => p.id_penitip === id);
        if (penitipToEdit) {
            setEditId(id);
            let formattedDate = "";
            if (penitipToEdit.tgl_lahir_penitip) {
                formattedDate = new Date(penitipToEdit.tgl_lahir_penitip)
                    .toISOString()
                    .split("T")[0];
            }
            setNewPenitip({
                nama_penitip: penitipToEdit.nama_penitip || "",
                email_penitip: penitipToEdit.email_penitip || "",
                password_penitip: "",
                tgl_lahir_penitip: formattedDate,
                no_telepon_penitip: penitipToEdit.no_telepon_penitip || "",
                nik_penitip: penitipToEdit.nik_penitip || "",
                foto_ktp_penitip: null,
                rating_penitip: penitipToEdit.rating_penitip || 0,
                pendapatan_penitip: penitipToEdit.pendapatan_penitip || 0,
                bonus_terjual_cepat: penitipToEdit.bonus_terjual_cepat || 0,
                reward_program_sosial: penitipToEdit.reward_program_sosial || 0,
            });
            setPreviewImage(
                penitipToEdit.foto_ktp_penitip
                    ? `http://127.0.0.1:8000/storage/${penitipToEdit.foto_ktp_penitip.replace(
                          "public/",
                          ""
                      )}`
                    : null
            );
            setShowModal(true);
        }
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
        localStorage.removeItem("nama_penitip");
        navigate("/generalLogin");
        toast.info("Anda telah logout.");
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditId(null);
        setPreviewImage(null);
        setNewPenitip({
            nama_penitip: "",
            email_penitip: "",
            password_penitip: "",
            tgl_lahir_penitip: "",
            no_telepon_penitip: "",
            nik_penitip: "",
            id_kategoribarang: "", // Added this to reflect common fields
            foto_ktp_penitip: null,
            rating_penitip: 0,
            pendapatan_penitip: 0,
            bonus_terjual_cepat: 0,
            reward_program_sosial: 0,
        });
    };

    // === Search Handlers ===
    const handleSearchPenitipChange = (e) => {
        setSearchTermPenitip(e.target.value);
        setCurrentPagePenitip(1);
    };

    const clearSearchPenitip = () => {
        setSearchTermPenitip("");
        setCurrentPagePenitip(1);
    };

    const handleSearchDiscussionChange = (e) => {
        setSearchTermDiscussion(e.target.value);
        setCurrentPageDiscussion(1);
    };

    const clearSearchDiscussion = () => {
        setSearchTermDiscussion("");
        setCurrentPageDiscussion(1);
    };

    const handleSearchVerificationChange = (e) => {
        setSearchTermVerification(e.target.value);
        setCurrentPageVerification(1);
    };

    // BARU: Search dan Filter untuk processed transactions
    const handleSearchProcessedChange = (e) => {
        setSearchTermProcessed(e.target.value);
        setCurrentPageProcessed(1);
        fetchProcessedTransactions(localStorage.getItem("authToken"), e.target.value, filterStatusProcessed);
    };

    const handleFilterStatusProcessedChange = (e) => {
        setFilterStatusProcessed(e.target.value);
        setCurrentPageProcessed(1);
        fetchProcessedTransactions(localStorage.getItem("authToken"), searchTermProcessed, e.target.value);
    };

    // === Handler Verifikasi Pembayaran ===
    const handleVerifyPayment = async (transactionId, isValid) => {
        const confirmMsg = `Yakin ingin ${isValid ? "memvalidasi" : "menolak"} pembayaran ini?`;
        if (!window.confirm(confirmMsg)) return;

        setVerifyingId(transactionId);
        const token = localStorage.getItem("authToken");

        try {
            const response = await axios.put(
                `http://127.0.0.1:8000/api/pegawai/verify-payment/${transactionId}`,
                { is_valid: isValid },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success(response.data.message || `Pembayaran berhasil ${isValid ? "divalidasi" : "ditolak"}.`);

            // Refresh daftar transaksi verifikasi dan daftar transaksi yang sudah diproses
            await fetchTransactionsForVerification(token, searchTermVerification);
            await fetchProcessedTransactions(token, searchTermProcessed, filterStatusProcessed);

        } catch (err) {
            console.error("Error verifying payment:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal memverifikasi pembayaran.");
        } finally {
            setVerifyingId(null);
        }
    };

    // BARU: Handler untuk melihat detail transaksi yang sudah diproses
    const handleViewProcessedDetails = (transaction) => {
        setSelectedProcessedTransaction(transaction);
        setShowProcessedDetailModal(true);
    };

    // BARU: Handler untuk menutup modal detail transaksi yang sudah diproses
    const handleCloseProcessedDetailModal = () => {
        setShowProcessedDetailModal(false);
        setSelectedProcessedTransaction(null);
    };


    const handleReplyClick = (discussion) => {
        setReplyingDiscussion(discussion);
        setReplyFormData({
            komentar_pegawai: discussion.komentar_pegawai || "",
            discussion_id: discussion.id_diskusi,
        });
        setShowReplyModal(true);
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        if (!replyingDiscussion || !replyFormData.discussion_id) {
            toast.error("Data diskusi tidak valid.");
            return;
        }
        if (!replyFormData.komentar_pegawai.trim()) {
            toast.error("Balasan tidak boleh kosong.");
            return;
        }

        const payload = {
            komentar_pegawai: replyFormData.komentar_pegawai,
        };

        try {
            const response = await axios.put(
                `http://127.0.0.1:8000/api/diskusi-produk/${replyFormData.discussion_id}`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log("Reply submitted successfully:", response.data);
            toast.success(response.data.message || "Balasan berhasil dikirim.");

            const currentToken = localStorage.getItem("authToken");
            if (currentToken) {
                await fetchAllDiscussions(currentToken);
            }

            handleCloseReplyModal();
        } catch (err) {
            console.error("Error submitting reply:", err.response?.data || err.message);
            const backendErrorMessage =
                err.response?.data?.message ||
                (err.response?.data?.errors
                    ? Object.values(err.response.data.errors).flat().join(" ")
                    : "Gagal mengirim balasan.");
            toast.error(backendErrorMessage);
        }
    };

    const handleCloseReplyModal = () => {
        setShowReplyModal(false);
        setReplyingDiscussion(null);
        setReplyFormData({ komentar_pegawai: "", discussion_id: null });
    };

    const handleSearchMerchandiseChange = (e) => {
        setSearchTermMerchandise(e.target.value);
        setCurrentPageMerchandise(1);
        fetchMerchandiseClaims(localStorage.getItem("authToken"), e.target.value, filterStatusMerchandise);
    };

    const handleFilterStatusMerchandiseChange = (e) => {
        setFilterStatusMerchandise(e.target.value);
        setCurrentPageMerchandise(1);
        fetchMerchandiseClaims(localStorage.getItem("authToken"), searchTermMerchandise, e.target.value);
    };

    // Tambahkan handler untuk update tanggal pengambilan merchandise
    const handleMerchPickupClick = (claim) => {
        setSelectedMerchClaim(claim);
        setPickupDate(claim.tgl_pengambilan_merchandise || "");
        setShowMerchPickupModal(true);
    };

    const handleMerchPickupSubmit = async (e) => {
        e.preventDefault();
        if (!pickupDate) {
            toast.error("Tanggal pengambilan harus diisi.");
            return;
        }

        const token = localStorage.getItem("authToken");
        try {
            const response = await axios.put(
                `http://127.0.0.1:8000/api/merchandise/${selectedMerchClaim.id_klaim_merchandise}`,
                { tgl_pengambilan_merchandise: pickupDate, status_pengajuan: "diambil" },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(response.data.message || "Tanggal pengambilan berhasil diperbarui.");
            await fetchMerchandiseClaims(token, searchTermMerchandise, filterStatusMerchandise);
            handleCloseMerchPickupModal();
        } catch (err) {
            console.error("Error updating pickup date:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Gagal memperbarui tanggal pengambilan.");
        }
    };

    const handleCloseMerchPickupModal = () => {
        setShowMerchPickupModal(false);
        setSelectedMerchClaim(null);
        setPickupDate("");
    };

    // === PAGINASI: PENITIP ===
    const filteredPenitip = penitip.filter((item) => {
        const search = searchTermPenitip.toLowerCase();
        return (
            item.nama_penitip?.toLowerCase().includes(search) ||
            item.email_penitip?.toLowerCase().includes(search) ||
            item.no_telepon_penitip?.toLowerCase().includes(search) ||
            item.nik_penitip?.toLowerCase().includes(search)
        );
    });

    const highlightMatch = (text, term) => {
        if (!term || !text) return text;
        const parts = text.toString().split(new RegExp(`(${term})`, "gi"));
        return parts.map((part, index) =>
            part.toLowerCase() === term.toLowerCase() ? (
                <span key={index} className="cs-search-highlight">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };

    const indexOfLastItemPenitip = currentPagePenitip * itemsPerPage;
    const indexOfFirstItemPenitip = indexOfLastItemPenitip - itemsPerPage;
    const currentItemsPenitip = filteredPenitip.slice(indexOfFirstItemPenitip, indexOfLastItemPenitip);
    const totalPagesPenitip = Math.ceil(filteredPenitip.length / itemsPerPage);
    const paginatePenitip = (page) => setCurrentPagePenitip(page);
    const nextPagePenitip = () => currentPagePenitip < totalPagesPenitip && setCurrentPagePenitip(currentPagePenitip + 1);
    const prevPagePenitip = () => currentPagePenitip > 1 && setCurrentPagePenitip(currentPagePenitip - 1);

    // === PAGINASI: DISKUSI ===
    const filteredDiscussions = allDiscussions.filter((discussion) => {
        const search = searchTermDiscussion.toLowerCase();
        return (
            discussion.barang?.nama_barang?.toLowerCase().includes(search) ||
            discussion.pembeli?.nama_pembeli?.toLowerCase().includes(search) ||
            discussion.komentar_pembeli?.toLowerCase().includes(search)
        );
    });
    const indexOfLastItemDiscussion = currentPageDiscussion * itemsPerPage;
    const indexOfFirstItemDiscussion = indexOfLastItemDiscussion - itemsPerPage;
    const currentItemsDiscussion = filteredDiscussions.slice(indexOfFirstItemDiscussion, indexOfLastItemDiscussion);
    const totalPagesDiscussion = Math.ceil(filteredDiscussions.length / itemsPerPage);
    const paginateDiscussion = (page) => setCurrentPageDiscussion(page);
    const nextPageDiscussion = () => currentPageDiscussion < totalPagesDiscussion && setCurrentPageDiscussion(currentPageDiscussion + 1);
    const prevPageDiscussion = () => currentPageDiscussion > 1 && setCurrentPageDiscussion(currentPageDiscussion - 1);

    // === PAGINASI: VERIFIKASI PEMBAYARAN ===
    const filteredTransactionsToVerify = transactionsToVerify.filter((trx) => {
        const search = searchTermVerification.toLowerCase();
        return (
            trx.nomor_transaksi_nota?.toLowerCase().includes(search) ||
            trx.pembeli?.nama_pembeli?.toLowerCase().includes(search)
        );
    });
    const indexOfLastItemVerification = currentPageVerification * itemsPerPage;
    const indexOfFirstItemVerification = indexOfLastItemVerification - itemsPerPage;
    const currentItemsVerification = filteredTransactionsToVerify.slice(indexOfFirstItemVerification, indexOfLastItemVerification);
    const totalPagesVerification = Math.ceil(filteredTransactionsToVerify.length / itemsPerPage);
    const paginateVerification = (page) => setCurrentPageVerification(page);
    const nextPageVerification = () => currentPageVerification < totalPagesVerification && setCurrentPageVerification(currentPageVerification + 1);
    const prevPageVerification = () => currentPageVerification > 1 && setCurrentPageVerification(currentPageVerification - 1);

    // BARU: PAGINASI: TRANSAKSI PROSES (HISTORY VERIFIKASI)
    const filteredProcessedTransactions = processedTransactions.filter((trx) => {
        const search = searchTermProcessed.toLowerCase();
        const statusMatch = filterStatusProcessed === "" || trx.status_pembayaran === filterStatusProcessed;
        return statusMatch && (
            trx.nomor_transaksi_nota?.toLowerCase().includes(search) ||
            trx.pembeli?.nama_pembeli?.toLowerCase().includes(search) ||
            trx.status_pembayaran?.toLowerCase().includes(search)
        );
    });
    const indexOfLastItemProcessed = currentPageProcessed * itemsPerPage;
    const indexOfFirstItemProcessed = indexOfLastItemProcessed - itemsPerPage;
    const currentItemsProcessed = filteredProcessedTransactions.slice(indexOfFirstItemProcessed, indexOfLastItemProcessed);
    const totalPagesProcessed = Math.ceil(filteredProcessedTransactions.length / itemsPerPage);
    const paginateProcessed = (page) => setCurrentPageProcessed(page);
    const nextPageProcessed = () => currentPageProcessed < totalPagesProcessed && setCurrentPageProcessed(currentPageProcessed + 1);
    const prevPageProcessed = () => currentPageProcessed > 1 && setCurrentPageProcessed(currentPageProcessed - 1);

    const filteredMerchandiseClaims = merchandiseClaims.filter((claim) => {
        const search = searchTermMerchandise.toLowerCase();
        const statusMatch = filterStatusMerchandise === "all" || claim.status_pengajuan === filterStatusMerchandise;
        return statusMatch && (
            claim.pembeli?.nama_pembeli?.toLowerCase().includes(search) ||
            claim.merchandise?.nama_merchandise?.toLowerCase().includes(search)
        );
    });
    const indexOfLastItemMerchandise = currentPageMerchandise * itemsPerPage;
    const indexOfFirstItemMerchandise = indexOfLastItemMerchandise - itemsPerPage;
    const currentItemsMerchandise = filteredMerchandiseClaims.slice(indexOfFirstItemMerchandise, indexOfLastItemMerchandise);
    const totalPagesMerchandise = Math.ceil(filteredMerchandiseClaims.length / itemsPerPage);
    const paginateMerchandise = (page) => setCurrentPageMerchandise(page);
    const nextPageMerchandise = () => currentPageMerchandise < totalPagesMerchandise && setCurrentPageMerchandise(currentPageMerchandise + 1);
    const prevPageMerchandise = () => currentPageMerchandise > 1 && setCurrentPageMerchandise(currentPageMerchandise - 1);

    // Render konten utama berdasarkan menu aktif
    const renderContent = () => {
        switch (activeMenu) {
            case "dashboard":
                return (
                    <div className="cs-dashboard-section">
                        <h3>Profil Customer Service</h3>
                        {csProfile ? (
                            <div className="cs-profile-details">
                                <p><strong>ID:</strong> {csProfile.id_pegawai}</p>
                                <p><strong>Nama:</strong> {csProfile.nama_pegawai}</p>
                                <p><strong>Email:</strong> {csProfile.email_pegawai}</p>
                                <p><strong>Jabatan:</strong> {csProfile.jabatan?.nama_jabatan || "Tidak Ada"}</p>
                            </div>
                        ) : (
                            <p>Memuat profil...</p>
                        )}
                    </div>
                );

            case "penitip":
                return (
                    <div className="cs-dashboard-section">
                        <div className="cs-section-header">
                            <h3>Manajemen Penitip</h3>
                            <button className="cs-add-btn" onClick={() => setShowModal(true)}>
                                <i className="fas fa-plus"></i> Tambah Penitip
                            </button>
                        </div>

                        <div className="cs-search-container">
                            <i className="fas fa-search cs-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Cari penitip berdasarkan nama, email, telepon, atau NIK"
                                className="cs-search-input"
                                value={searchTermPenitip}
                                onChange={handleSearchPenitipChange}
                            />
                            {searchTermPenitip && (
                                <button className="cs-clear-search" onClick={clearSearchPenitip}>
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>

                        {searchTermPenitip && (
                            <div className="cs-search-results-info">
                                Menampilkan {filteredPenitip.length} dari {penitip.length} penitip
                            </div>
                        )}

                        {loading ? (
                            <div className="cs-loading-container">
                                <div className="cs-loading-spinner"></div>
                                <p>Memuat data penitip...</p>
                            </div>
                        ) : error ? (
                            <div className="cs-error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                <p>{error}</p>
                            </div>
                        ) : currentItemsPenitip.length > 0 ? (
                            <div className="cs-penitip-table-container">
                                <table className="cs-penitip-table">
                                    <thead>
                                        <tr>
                                            <th>Nama</th>
                                            <th>Email</th>
                                            <th>Telepon</th>
                                            <th>NIK</th>
                                            <th>Tanggal Lahir</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItemsPenitip.map((item) => (
                                            <tr key={item.id_penitip}>
                                                <td>{highlightMatch(item.nama_penitip, searchTermPenitip)}</td>
                                                <td>{highlightMatch(item.email_penitip, searchTermPenitip)}</td>
                                                <td>{highlightMatch(item.no_telepon_penitip, searchTermPenitip)}</td>
                                                <td>{highlightMatch(item.nik_penitip, searchTermPenitip)}</td>
                                                <td>
                                                    {item.tgl_lahir_penitip
                                                        ? new Date(item.tgl_lahir_penitip).toLocaleDateString("id-ID")
                                                        : "-"}
                                                </td>
                                                <td className="cs-action-buttons">
                                                    <button className="cs-edit-btn" onClick={() => handleEditPenitip(item.id_penitip)}>
                                                        <i className="fas fa-edit">Edit</i>
                                                    </button>
                                                    <button className="cs-delete-btn" onClick={() => handleDeletePenitip(item.id_penitip)}>
                                                        <i className="fas fa-trash-alt">Hapus</i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Paginasi untuk Penitip */}
                                <div className="cs-pagination">
                                    <button onClick={prevPagePenitip} disabled={currentPagePenitip === 1}>Previous</button>
                                    {Array.from({ length: totalPagesPenitip }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            className={`cs-paginate-btn ${currentPagePenitip === number ? "cs-active" : ""}`}
                                            onClick={() => paginatePenitip(number)}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button onClick={nextPagePenitip} disabled={currentPagePenitip === totalPagesPenitip}>Next</button>
                                </div>
                            </div>
                        ) : (
                            <div className="cs-no-data-container">
                                <div className="cs-no-data-icon">
                                    <i className="fas fa-users-slash"></i>
                                </div>
                                <p>Belum ada data penitip</p>
                                <button className="cs-add-btn-empty" onClick={() => setShowModal(true)}>
                                    <i className="fas fa-plus"></i> Tambah Penitip Pertama
                                </button>
                            </div>
                        )}
                    </div>
                );

            case "diskusi":
                return (
                    <div className="cs-dashboard-section">
                        <h3>Daftar Diskusi Produk</h3>
                        <div className="cs-discussion-table-container">
                            {currentItemsDiscussion.length > 0 ? (
                                <>
                                    <table className="cs-discussion-table">
                                        <thead>
                                            <tr>
                                                <th>Barang</th>
                                                <th>Pembeli</th>
                                                <th>Komentar Pembeli</th>
                                                <th>Balasan CS</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItemsDiscussion.map((discussion) => (
                                                <tr key={discussion.id_diskusi}>
                                                    <td className="cs-product-cell">
                                                        <div className="cs-product-info-cell">
                                                            {discussion.barang?.image && (
                                                                <img
                                                                    src={`http://127.0.0.1:8000/images/${discussion.barang.image}`}
                                                                    alt={discussion.barang.nama_barang || "Barang"}
                                                                    className="cs-product-image-small"
                                                                />
                                                            )}
                                                            <span>{discussion.barang?.nama_barang || "N/A"}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <strong>Nama:</strong> {discussion.pembeli?.nama_pembeli || "N/A"}
                                                        <br />
                                                        <strong>Email:</strong> {discussion.pembeli?.email_pembeli || "N/A"}
                                                    </td>
                                                    <td>{discussion.komentar_pembeli}</td>
                                                    <td>
                                                        {discussion.komentar_pegawai ? (
                                                            <div>
                                                                <strong>Oleh:</strong> {discussion.pegawai?.nama_pegawai || "N/A"}
                                                                <br />
                                                                {discussion.komentar_pegawai}
                                                            </div>
                                                        ) : (
                                                            <em className="cs-reply-pending">Belum ada balasan.</em>
                                                        )}
                                                    </td>
                                                    <td className="cs-action-buttons">
                                                        <button className="cs-reply-btn" onClick={() => handleReplyClick(discussion)}>
                                                            Balas
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Paginasi untuk Diskusi */}
                                    <div className="cs-pagination">
                                        <button onClick={prevPageDiscussion} disabled={currentPageDiscussion === 1}>Previous</button>
                                        {Array.from({ length: totalPagesDiscussion }, (_, i) => i + 1).map((number) => (
                                            <button
                                                key={number}
                                                className={`cs-paginate-btn ${currentPageDiscussion === number ? "cs-active" : ""}`}
                                                onClick={() => paginateDiscussion(number)}
                                            >
                                                {number}
                                            </button>
                                        ))}
                                        <button onClick={nextPageDiscussion} disabled={currentPageDiscussion === totalPagesDiscussion}>Next</button>
                                    </div>
                                </>
                            ) : (
                                <p className="cs-no-data-message">Tidak ada diskusi produk saat ini.</p>
                            )}
                        </div>
                    </div>
                );

            case "verifikasi":
                return (
                    <div className="cs-dashboard-section">
                        <h3>Verifikasi Pembayaran Transaksi</h3>
                        <div className="cs-search-container">
                            <i className="fas fa-search cs-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Cari No. Transaksi atau Nama Pembeli..."
                                className="cs-search-input"
                                value={searchTermVerification}
                                onChange={handleSearchVerificationChange}
                            />
                        </div>

                        {loading ? (
                            <div className="cs-loading-container">
                                <div className="cs-loading-spinner"></div>
                                <p>Memuat transaksi untuk verifikasi...</p>
                            </div>
                        ) : error ? (
                            <div className="cs-error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                <p>{error}</p>
                            </div>
                        ) : currentItemsVerification.length > 0 ? (
                            <div className="cs-verification-table-container">
                                <table className="cs-verification-table">
                                    <thead>
                                        <tr>
                                            <th>No. Transaksi</th>
                                            <th>Pembeli</th>
                                            <th>Total Bayar</th>
                                            {/* BARU: Kolom untuk Detail Barang */}
                                            {/* <th>Barang Diverifikasi</th>  */}
                                            <th>Bukti Pembayaran</th>
                                            <th>Status Pembayaran</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItemsVerification.map((transaction) => (
                                            <tr key={transaction.id_pembelian}>
                                                <td>{transaction.nomor_transaksi_nota}</td>
                                                <td>{transaction.pembeli?.nama_pembeli || 'N/A'}</td>
                                                <td>Rp {Number(transaction.total_bayar).toLocaleString('id-ID')}</td>
                                                {/* BARU: Tampilkan detail barang di tabel verifikasi */}
                                                {/* <td className="cs-product-cell">
                                                    {transaction.detailTransaksiPembelian && transaction.detailTransaksiPembelian.length > 0 ? (
                                                        transaction.detailTransaksiPembelian.map((item, itemIndex) => (
                                                            <div key={itemIndex} className="cs-product-info-cell cs-table-item-detail">
                                                                {item.barang?.image && (
                                                                    <img
                                                                        src={`http://127.0.0.1:8000/images/${item.barang.image}`}
                                                                        alt={item.barang.nama_barang || 'Barang'}
                                                                        className="cs-product-image-small"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <span>{item.barang?.nama_barang || 'N/A'}</span>
                                                                    <br />
                                                                    <small>x{item.jumlah_barang_pembelian}</small>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span>N/A</span> // Jika tidak ada detail barang
                                                    )}
                                                </td> */}
                                                {/* END BARU */}
                                                <td>
                                                    {transaction.bukti_pembayaran ? (
                                                        <a
                                                            href={`http://127.0.0.1:8000/bukti_pembayaran/${transaction.bukti_pembayaran}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="cs-link-button"
                                                        >
                                                            Lihat Bukti
                                                        </a>
                                                    ) : (
                                                        <span className="cs-no-proof">Belum ada</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`cs-payment-status status-${transaction.status_pembayaran}`}>
                                                        {transaction.status_pembayaran.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="cs-action-buttons">
                                                    <button
                                                        className="cs-verify-btn cs-success"
                                                        onClick={() => handleVerifyPayment(transaction.id_pembelian, true)}
                                                        disabled={verifyingId === transaction.id_pembelian}
                                                    >
                                                        {verifyingId === transaction.id_pembelian ? 'Memvalidasi...' : 'Validasi'}
                                                    </button>
                                                    <button
                                                        className="cs-verify-btn cs-danger"
                                                        onClick={() => handleVerifyPayment(transaction.id_pembelian, false)}
                                                        disabled={verifyingId === transaction.id_pembelian}
                                                    >
                                                        {verifyingId === transaction.id_pembelian ? 'Menolak...' : 'Tolak'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Paginasi untuk Verifikasi */}
                                <div className="cs-pagination">
                                    <button onClick={() => paginateVerification(currentPageVerification - 1)} disabled={currentPageVerification === 1}>Previous</button>
                                    {Array.from({ length: totalPagesVerification }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => paginateVerification(page)}
                                            className={currentPageVerification === page ? 'cs-active' : ''}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button onClick={() => paginateVerification(currentPageVerification + 1)} disabled={currentPageVerification === totalPagesVerification}>Next</button>
                                </div>
                            </div>
                        ) : (
                            <p className="cs-no-data-message">Tidak ada transaksi yang menunggu verifikasi.</p>
                        )}
                    </div>
                );

            // BARU: Case untuk menu riwayat verifikasi
            case "riwayat-verifikasi":
                return (
                    <div className="cs-dashboard-section">
                        <h3>Riwayat Verifikasi Pembayaran</h3>
                        <div className="cs-search-filter-container">
                            <div className="cs-search-container">
                                <i className="fas fa-search cs-search-icon"></i>
                                <input
                                    type="text"
                                    placeholder="Cari No. Transaksi atau Nama Pembeli..."
                                    className="cs-search-input"
                                    value={searchTermProcessed}
                                    onChange={handleSearchProcessedChange}
                                />
                            </div>
                            <div className="cs-filter-select-container">
                                <label htmlFor="filterStatusProcessed" className="cs-filter-label">Filter Status:</label>
                                <select 
                                    id="filterStatusProcessed"
                                    className="cs-filter-select"
                                    value={filterStatusProcessed}
                                    onChange={handleFilterStatusProcessedChange}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="valid">Valid</option>
                                    <option value="tidak_valid">Tidak Valid</option>
                                    <option value="dibatalkan">Dibatalkan</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="cs-loading-container">
                                <div className="cs-loading-spinner"></div>
                                <p>Memuat riwayat transaksi...</p>
                            </div>
                        ) : error ? (
                            <div className="cs-error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                <p>{error}</p>
                            </div>
                        ) : currentItemsProcessed.length > 0 ? (
                            <div className="cs-processed-table-container">
                                <table className="cs-processed-table">
                                    <thead>
                                        <tr>
                                            <th>No. Transaksi</th>
                                            <th>Pembeli</th>
                                            <th>Total Bayar</th>
                                            {/* BARU: Kolom untuk Detail Barang */}
                                            {/* <th>Barang</th> */}
                                            <th>Status Pembayaran</th>
                                            <th>Tanggal Pembayaran</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItemsProcessed.map((transaction) => (
                                            <tr key={transaction.id_pembelian}>
                                                <td>{transaction.nomor_transaksi_nota}</td>
                                                <td>{transaction.pembeli?.nama_pembeli || 'N/A'}</td>
                                                <td>Rp {Number(transaction.total_bayar).toLocaleString('id-ID')}</td>
                                                {/* END BARU */}
                                                <td>
                                                    <span className={`cs-payment-status status-${transaction.status_pembayaran}`}>
                                                        {transaction.status_pembayaran.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    {transaction.tanggal_pembayaran ?
                                                        new Date(transaction.tanggal_pembayaran).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                        : 'N/A'}
                                                </td>
                                                <td className="cs-action-buttons">
                                                    <button
                                                        className="cs-view-detail-btn"
                                                        onClick={() => handleViewProcessedDetails(transaction)}
                                                    >
                                                        Lihat Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Paginasi untuk Riwayat Verifikasi */}
                                <div className="cs-pagination">
                                    <button onClick={prevPageProcessed} disabled={currentPageProcessed === 1}>Previous</button>
                                    {Array.from({ length: totalPagesProcessed }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => paginateProcessed(page)}
                                            className={currentPageProcessed === page ? 'cs-active' : ''}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button onClick={nextPageProcessed} disabled={currentPageProcessed === totalPagesProcessed}>Next</button>
                                </div>
                            </div>
                        ) : (
                            <p className="cs-no-data-message">Tidak ada riwayat transaksi yang sudah diproses.</p>
                        )}
                    </div>
                );

                case "merchandise":
                return (
                    <div className="cs-dashboard-section">
                        <h3>Klaim Merchandise Pembeli</h3>
                        <div className="cs-search-filter-container">
                            <div className="cs-search-container">
                                <i className="fas fa-search cs-search-icon"></i>
                                <input
                                    type="text"
                                    placeholder="Cari Nama Pembeli atau Merchandise..."
                                    className="cs-search-input"
                                    value={searchTermMerchandise}
                                    onChange={handleSearchMerchandiseChange}
                                />
                            </div>
                            <div className="cs-filter-select-container">
                                <label htmlFor="filterStatusMerchandise" className="cs-filter-label">Filter Status:</label>
                                <select
                                    id="filterStatusMerchandise"
                                    className="cs-filter-select"
                                    value={filterStatusMerchandise}
                                    onChange={handleFilterStatusMerchandiseChange}
                                >
                                    <option value="all">Semua</option>
                                    <option value="belum_diambil">Belum Diambil</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="cs-loading-container">
                                <div className="cs-loading-spinner"></div>
                                <p>Memuat daftar klaim merchandise...</p>
                            </div>
                        ) : error ? (
                            <div className="cs-error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                <p>{error}</p>
                            </div>
                        ) : currentItemsMerchandise.length > 0 ? (
                            <div className="cs-merchandise-table-container">
                                <table className="cs-merchandise-table">
                                    <thead>
                                        <tr>
                                            <th>ID Pengajuan</th>
                                            <th>Pembeli</th>
                                            <th>Merchandise</th>
                                            <th>Poin Dibutuhkan</th>
                                            <th>Status</th>
                                            <th>Tanggal Ambil</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItemsMerchandise.map((claim) => (
                                            <tr key={claim.id_klaim_merchandise}>
                                                <td>{claim.id_klaim_merchandise}</td>
                                                <td>{claim.pembeli?.nama_pembeli || 'N/A'}</td>
                                                <td>{claim.merchandise?.nama_merchandise || 'N/A'}</td>
                                                <td>{claim.merchandise?.poin_merch || 0}</td>
                                                <td>
                                                    <span className={`cs-payment-status status-${claim.status_pengajuan || 'unknown'}`}>
                                                        {claim.status_pengajuan ? claim.status_pengajuan.replace('_', ' ').toUpperCase() : 'TIDAK DIKETAHUI'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {claim.tgl_pengambilan_merchandise ?
                                                        new Date(claim.tgl_pengambilan_merchandise).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'Belum Diambil'}
                                                </td>
                                                <td className="cs-action-buttons">
                                                    {claim.status_pengajuan === 'belum_diambil' && (
                                                        <button
                                                            className="cs-update-btn"
                                                            onClick={() => handleMerchPickupClick(claim)}
                                                        >
                                                            Update Tanggal Ambil
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="cs-pagination">
                                    <button onClick={prevPageMerchandise} disabled={currentPageMerchandise === 1}>Previous</button>
                                    {Array.from({ length: totalPagesMerchandise }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => paginateMerchandise(page)}
                                            className={currentPageMerchandise === page ? 'cs-active' : ''}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button onClick={nextPageMerchandise} disabled={currentPageMerchandise === totalPagesMerchandise}>Next</button>
                                </div>
                            </div>
                        ) : (
                            <p className="cs-no-data-message">Tidak ada klaim merchandise saat ini.</p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };


    if (loading) return (
        <div className="cs-loading-container">
            <div className="cs-loading-spinner"></div>
            Memuat Dashboard...
        </div>
    );
    if (error) return <div className="cs-error-state">Error: {error}</div>;

    return (
        <div className="cs-dashboard">
            {/* Sidebar kiri */}
            <aside className="cs-sidebar">
                <div className="cs-sidebar-logo">REUSEMART CS</div>
                <nav className="cs-sidebar-nav">
                    <ul>
                        <li
                            className={activeMenu === "dashboard" ? "cs-active" : ""}
                            onClick={() => setActiveMenu("dashboard")}
                        >
                            Dashboard
                        </li>
                        <li
                            className={activeMenu === "penitip" ? "cs-active" : ""}
                            onClick={() => setActiveMenu("penitip")}
                        >
                            Manajemen Penitip
                        </li>
                        <li
                            className={activeMenu === "diskusi" ? "cs-active" : ""}
                            onClick={() => setActiveMenu("diskusi")}
                        >
                            Diskusi Produk
                        </li>
                        {/* BARU: Menu Verifikasi Pembayaran */}
                        <li
                            className={activeMenu === "verifikasi" ? "cs-active" : ""}
                            onClick={() => setActiveMenu("verifikasi")}
                        >
                            Verifikasi Pembayaran
                        </li>
                        {/* BARU: Menu Riwayat Verifikasi Pembayaran */}
                        <li
                            className={activeMenu === "riwayat-verifikasi" ? "cs-active" : ""}
                            onClick={() => setActiveMenu("riwayat-verifikasi")}
                        >
                            Riwayat Verifikasi
                        </li>
                        <li
                            className={activeMenu === "merchandise" ? "cs-active" : ""}
                            onClick={() => setActiveMenu("merchandise")}
                        >
                            Klaim Merchandise
                        </li>
                        <li onClick={handleLogout} className="cs-logout-btn">
                            Logout
                        </li>
                    </ul>
                </nav>
            </aside>


            {/* Konten utama */}
            <main className="cs-dashboard-container">
                <h2>
                {activeMenu === "dashboard" ? "Dashboard Customer Service"
                    : activeMenu === "penitip" ? "Manajemen Penitip"
                    : activeMenu === "diskusi" ? "Diskusi Produk"
                    : activeMenu === "verifikasi" ? "Verifikasi Pembayaran"
                    : activeMenu === "riwayat-verifikasi" ? "Riwayat Verifikasi Pembayaran"
                    : activeMenu === "merchandise" ? "Klaim Merchandise Pembeli"
                    : ""}
            </h2>
            {renderContent()}

                {/* Modal Penitip */}
                {showModal && (
                    <div className="cs-modal">
                        <div className="cs-modal-content">
                            <div className="cs-modal-header">
                                <h3>{editId !== null ? "Edit Data Penitip" : "Tambah Penitip"}</h3>
                                <button className="cs-close-btn" onClick={handleCloseModal}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleAddOrUpdatePenitip}>
                                <div className="cs-form-grid">
                                    <div className="cs-form-group">
                                        <label htmlFor="nama_penitip">
                                            <i className="fas fa-user"></i> Nama Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            id="nama_penitip"
                                            placeholder="Masukkan nama lengkap"
                                            value={newPenitip.nama_penitip}
                                            onChange={(e) =>
                                                setNewPenitip({ ...newPenitip, nama_penitip: e.target.value })
                                            }
                                            required={editId === null}
                                        />
                                    </div>
                                    <div className="cs-form-group">
                                        <label htmlFor="email_penitip">
                                            <i className="fas fa-envelope"></i> Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email_penitip"
                                            placeholder="Masukkan alamat email"
                                            value={newPenitip.email_penitip}
                                            onChange={(e) =>
                                                setNewPenitip({ ...newPenitip, email_penitip: e.target.value })
                                            }
                                            required={editId === null}
                                        />
                                    </div>
                                    <div className="cs-form-group">
                                        <label htmlFor="password_penitip">
                                            <i className="fas fa-lock"></i>{" "}
                                            {editId !== null ? "Password (Kosongkan jika tidak diubah)" : "Password"}
                                        </label>
                                        <input
                                            type="password"
                                            id="password_penitip"
                                            placeholder={
                                                editId !== null ? "Kosongkan jika tidak diubah" : "Masukkan password"
                                            }
                                            value={newPenitip.password_penitip}
                                            onChange={(e) =>
                                                setNewPenitip({ ...newPenitip, password_penitip: e.target.value })
                                            }
                                            required={editId === null}
                                        />
                                    </div>
                                    <div className="cs-form-group">
                                        <label htmlFor="no_telepon_penitip">
                                            <i className="fas fa-phone"></i> Nomor Telepon
                                        </label>
                                        <input
                                            type="text"
                                            id="no_telepon_penitip"
                                            placeholder="Masukkan nomor telepon (contoh: +6281234567890)"
                                            value={newPenitip.no_telepon_penitip}
                                            onChange={(e) =>
                                                setNewPenitip({ ...newPenitip, no_telepon_penitip: e.target.value })
                                            }
                                            required={editId === null}
                                            pattern="[0-9\+-]+"
                                            title="Nomor telepon hanya boleh berisi angka, tanda +, atau tanda -"
                                        />
                                    </div>
                                    <div className="cs-form-group">
                                        <label htmlFor="tgl_lahir_penitip">
                                            <i className="fas fa-calendar-alt"></i> Tanggal Lahir
                                        </label>
                                        <input
                                            type="date"
                                            id="tgl_lahir_penitip"
                                            value={newPenitip.tgl_lahir_penitip}
                                            onChange={(e) =>
                                                setNewPenitip({ ...newPenitip, tgl_lahir_penitip: e.target.value })
                                            }
                                            required={editId === null}
                                        />
                                    </div>
                                    <div className="cs-form-group">
                                        <label htmlFor="nik_penitip">
                                            <i className="fas fa-id-card"></i> NIK
                                        </label>
                                        <input
                                            type="text"
                                            id="nik_penitip"
                                            placeholder="Masukkan Nomor Induk Kependudukan (16 digit)"
                                            value={newPenitip.nik_penitip}
                                            onChange={(e) =>
                                                setNewPenitip({ ...newPenitip, nik_penitip: e.target.value })
                                            }
                                            required={editId === null}
                                            pattern="[0-9]{16}"
                                            title="NIK harus terdiri dari 16 digit angka"
                                        />
                                    </div>
                                </div>
                                <div className="cs-form-group cs-foto-ktp-container">
                                    <label htmlFor="foto_ktp_penitip">
                                        <i className="fas fa-image"></i> Foto KTP
                                    </label>
                                    <div className="cs-foto-ktp-input">
                                        <input
                                            type="file"
                                            id="foto_ktp_penitip"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="cs-file-input"
                                            required={false}
                                        />
                                        <label htmlFor="foto_ktp_penitip" className="cs-file-label">
                                            <i className="fas fa-upload"></i>
                                            <span>
                                                {newPenitip.foto_ktp_penitip
                                                    ? newPenitip.foto_ktp_penitip.name
                                                    : editId !== null && previewImage
                                                    ? "Foto KTP sudah ada"
                                                    : "Pilih file foto KTP (opsional)"}
                                            </span>
                                        </label>
                                    </div>
                                    {previewImage && (
                                        <div className="cs-image-preview">
                                            <img src={previewImage} alt="Preview KTP" />
                                        </div>
                                    )}
                                    {editId !== null && (
                                        <p className="cs-file-note">
                                            <i className="fas fa-info-circle"></i> Biarkan kosong jika tidak ingin
                                            mengubah foto KTP
                                        </p>
                                    )}
                                </div>
                                <div className="cs-modal-actions">
                                    <button
                                        type="button"
                                        className="cs-cancel-btn"
                                        onClick={handleCloseModal}
                                    >
                                        <i className="fas fa-times"></i> Batal
                                    </button>
                                    <button type="submit" className="cs-submit-btn">
                                        <i className="fas fa-save"></i>{" "}
                                        {editId !== null ? "Perbarui Data" : "Simpan Data"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Reply Diskusi */}
                {showReplyModal && replyingDiscussion && (
                    <div className="cs-modal">
                        <div className="cs-modal-content">
                            <div className="cs-modal-header">
                                <h3>Balas Diskusi Produk</h3>
                                <button className="cs-close-btn" onClick={handleCloseReplyModal}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleReplySubmit}>
                                <div className="cs-form-grid">
                                    <div
                                        className="cs-form-group"
                                        style={{
                                            gridColumn: "1 / -1",
                                            border: "1px solid #eee",
                                            padding: "1rem",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        <h4>Diskusi:</h4>
                                        <p>
                                            <strong>Barang:</strong>{" "}
                                            {replyingDiscussion.barang?.nama_barang || "N/A"}
                                        </p>
                                        <p>
                                            <strong>Pembeli:</strong>{" "}
                                            {replyingDiscussion.pembeli?.nama_pembeli || "N/A"}
                                        </p>
                                        <p>
                                            <strong>Komentar:</strong> {replyingDiscussion.komentar_pembeli}
                                        </p>
                                        {replyingDiscussion.barang?.image && (
                                            <img
                                                src={`http://127.0.0.1:8000/images/${replyingDiscussion.barang.image}`}
                                                alt={replyingDiscussion.barang.nama_barang || "Barang"}
                                                style={{
                                                    width: "80px",
                                                    height: "80px",
                                                    objectFit: "cover",
                                                    borderRadius: "4px",
                                                    marginTop: "0.5rem",
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="cs-form-group" style={{ gridColumn: "1 / -1" }}>
                                        <label htmlFor="komentar_pegawai">Balasan Anda:</label>
                                        <textarea
                                            id="komentar_pegawai"
                                            placeholder="Tulis balasan Anda di sini..."
                                            value={replyFormData.komentar_pegawai}
                                            onChange={(e) =>
                                                setReplyFormData({
                                                    ...replyFormData,
                                                    komentar_pegawai: e.target.value,
                                                })
                                            }
                                            required
                                            rows="4"
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem",
                                                border: "1px solid #ddd",
                                                borderRadius: "5px",
                                                fontSize: "0.95rem",
                                                color: "#000000",
                                            }}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="cs-modal-actions">
                                    <button
                                        type="button"
                                        className="cs-cancel-btn"
                                        onClick={handleCloseReplyModal}
                                    >
                                        Batal
                                    </button>
                                    <button type="submit" className="cs-submit-btn">
                                        Kirim Balasan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* BARU: Modal Detail Transaksi yang Sudah Diproses */}
                {showProcessedDetailModal && selectedProcessedTransaction && (
                    <div className="cs-modal">
                        <div className="cs-modal-content">
                            <div className="cs-modal-header">
                                <h3>Detail Transaksi #{selectedProcessedTransaction.nomor_transaksi_nota}</h3>
                                <button className="cs-close-btn" onClick={handleCloseProcessedDetailModal}>×</button>
                            </div>
                            <div className="cs-transaction-details">
                                <p><strong>Pembeli:</strong> {selectedProcessedTransaction.pembeli?.nama_pembeli || 'N/A'}</p>
                                <p><strong>Email Pembeli:</strong> {selectedProcessedTransaction.pembeli?.email_pembeli || 'N/A'}</p>
                                <p><strong>Total Bayar:</strong> Rp {Number(selectedProcessedTransaction.total_bayar).toLocaleString('id-ID')}</p>
                                <p><strong>Status Pembayaran:</strong> <span className={`cs-payment-status status-${selectedProcessedTransaction.status_pembayaran}`}>
                                    {selectedProcessedTransaction.status_pembayaran.replace('_', ' ').toUpperCase()}
                                </span></p>
                                <p><strong>Tanggal Pembelian:</strong> {new Date(selectedProcessedTransaction.tanggal_pembelian).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p><strong>Tanggal Pembayaran:</strong> {selectedProcessedTransaction.tanggal_pembayaran ? new Date(selectedProcessedTransaction.tanggal_pembayaran).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Belum Dibayar'}</p>
                                <p><strong>Jenis Pengiriman:</strong> {selectedProcessedTransaction.jenis_pengiriman === 'kurir' ? `Kurir (${selectedProcessedTransaction.alamat_pembeli})` : 'Ambil Sendiri'}</p>
                                <p><strong>Biaya Ongkir:</strong> Rp {Number(selectedProcessedTransaction.biaya_ongkir).toLocaleString('id-ID')}</p>
                                <p><strong>Poin Dipakai:</strong> {selectedProcessedTransaction.tukar_poin_potongan}</p>
                                <p><strong>Poin Didapat:</strong> {selectedProcessedTransaction.poin_pembelian}</p>
                                
                                {selectedProcessedTransaction.bukti_pembayaran && (
                                    <div className="cs-proof-section">
                                        <strong>Bukti Pembayaran:</strong>
                                        <a
                                            href={`http://127.0.0.1:8000/bukti_pembayaran/${selectedProcessedTransaction.bukti_pembayaran}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="cs-link-button cs-proof-link"
                                        >
                                            Lihat Gambar Bukti Pembayaran
                                        </a>
                                        {selectedProcessedTransaction.bukti_pembayaran && (
                                            <img
                                                src={`http://127.0.0.1:8000/bukti_pembayaran/${selectedProcessedTransaction.bukti_pembayaran}`}
                                                alt="Bukti Pembayaran"
                                                className="cs-bukti-pembayaran-img"
                                            />
                                        )}
                                    </div>
                                )}

                                <div className="cs-detail-items">
                                    <h4>Detail Barang:</h4>
                                    {selectedProcessedTransaction.detailTransaksiPembelian && Array.isArray(selectedProcessedTransaction.detailTransaksiPembelian) && selectedProcessedTransaction.detailTransaksiPembelian.length > 0 ? (
                                        <table className="cs-detail-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Barang</th>
                                                    <th>Kuantitas</th>
                                                    <th>Harga Satuan</th>
                                                    <th>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedProcessedTransaction.detailTransaksiPembelian.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="cs-product-info-cell">
                                                                {item.barang?.image && (
                                                                    <img
                                                                        src={`http://127.0.0.1:8000/images/${item.barang.image}`}
                                                                        alt={item.barang?.nama_barang || 'Barang'}
                                                                        className="cs-product-image-small"
                                                                    />
                                                                )}
                                                                <span>{item.barang?.nama_barang || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td>{item.jumlah_barang_pembelian}</td>
                                                        <td>Rp {Number(item.barang?.harga_barang || 0).toLocaleString('id-ID')}</td>
                                                        <td>Rp {(item.jumlah_barang_pembelian * Number(item.barang?.harga_barang || 0)).toLocaleString('id-ID')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>Tidak ada detail barang untuk transaksi ini.</p>
                                    )}
                                </div>
                            </div>
                            <div className="cs-modal-actions">
                                <button className="cs-cancel-btn" onClick={handleCloseProcessedDetailModal}>Tutup</button>
                            </div>
                        </div>
                    </div>
                )}

                {showMerchPickupModal && selectedMerchClaim && (
                <div className="cs-modal">
                    <div className="cs-modal-content">
                        <div className="cs-modal-header">
                            <h3>Update Tanggal Pengambilan Merchandise</h3>
                            <button className="cs-close-btn" onClick={handleCloseMerchPickupModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleMerchPickupSubmit}>
                            <div className="cs-form-grid">
                                <div className="cs-form-group" style={{ gridColumn: "1 / -1" }}>
                                    <p><strong>Pembeli:</strong> {selectedMerchClaim.pembeli?.nama_pembeli || 'N/A'}</p>
                                    <p><strong>Merchandise:</strong> {selectedMerchClaim.merchandise?.nama_merchandise || 'N/A'}</p>
                                </div>
                                <div className="cs-form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label htmlFor="pickupDate">
                                        <i className="fas fa-calendar-alt"></i> Tanggal Pengambilan
                                    </label>
                                    <input
                                        type="date"
                                        id="pickupDate"
                                        value={pickupDate}
                                        onChange={(e) => setPickupDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="cs-modal-actions">
                                <button
                                    type="button"
                                    className="cs-cancel-btn"
                                    onClick={handleCloseMerchPickupModal}
                                >
                                    Batal
                                </button>
                                <button type="submit" className="cs-submit-btn">
                                    Simpan
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

export default CSDashboard;