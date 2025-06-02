import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import NotaPenitipanPDF from "./notaPenitipan";

const PrintNotaPDF = () => {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Token autentikasi tidak ditemukan.");
        setLoading(false);
        return;
      }
      console.log("Fetching data for ID:", id);
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/transaksi-penitipan/${id}/nota`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransaction(response.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(`Gagal memuat data transaksi. Status: ${err.response?.status}, Pesan: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!transaction) return <div>Data tidak tersedia.</div>;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      <h2>Nota Penitipan Barang - ID: {transaction.id_penitipan_transaksi}</h2>
      <PDFDownloadLink
        document={<NotaPenitipanPDF transaction={transaction} />}
        fileName={`nota_penitipan_${transaction.id_penitipan_transaksi}.pdf`}
        style={{
          margin: "10px 0",
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        {({ loading }) => (loading ? "Mempersiapkan PDF..." : "Unduh Nota PDF")}
      </PDFDownloadLink>
      <PDFViewer width="600" height="800">
        <NotaPenitipanPDF transaction={transaction} />
      </PDFViewer>
    </div>
  );
};

export default PrintNotaPDF;