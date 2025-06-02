import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Definisi gaya untuk PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  header: { textAlign: "center", marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold" },
  subtitle: { fontSize: 12, marginTop: 5 },
  section: { marginBottom: 10 },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginBottom: 10,
  },
  tableRow: { flexDirection: "row" },
  tableColHeader: {
    width: "50%", // Dua kolom, masing-masing 50%
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    backgroundColor: "#f0f0f0",
    padding: 5,
    fontWeight: "bold",
  },
  tableCol: {
    width: "50%", // Dua kolom, masing-masing 50%
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    padding: 5,
  },
  textBold: { fontWeight: "bold" },
});

const NotaPenitipanPDF = ({ transaction }) => {
  const penitipAlamat = transaction.penitip?.alamat_penitip || "Alamat tidak tersedia";
  const deliveryInfo = transaction.penitip?.no_telepon_penitip
    ? `Delivery: Kurir ReUseMart (${transaction.penitip.no_telepon_penitip})`
    : "Delivery: Tidak ada informasi kurir";
  const qcBy = transaction.pegawai?.nama_pegawai
    ? `P${transaction.pegawai.id_pegawai} - ${transaction.pegawai.nama_pegawai}`
    : "Pegawai tidak diketahui";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ReUse Mart</Text>
          <Text style={styles.subtitle}>Jl. Green Eco Park No. 456 Yogyakarta</Text>
          <Text style={styles.subtitle}>Nota Penitipan Barang</Text>
          <Text style={styles.subtitle}>No Nota: {transaction.nomor_nota || transaction.id_penitipan_transaksi}</Text>
          <Text style={styles.subtitle}>
            Tanggal Penitipan: {new Date(transaction.tanggal_mulai_penitipan).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
          </Text>
          <Text style={styles.subtitle}>
            Masa Penitipan Sampai: {new Date(transaction.tanggal_akhir_penitipan).toLocaleString("id-ID", { dateStyle: "medium" })}
          </Text>
        </View>

        {/* Informasi Penitip */}
        <View style={styles.section}>
          <Text style={styles.textBold}>Penitip: {transaction.penitip?.nama_penitip || "Tidak diketahui"}</Text>
          <Text>{penitipAlamat}</Text>
          <Text>{deliveryInfo}</Text>
        </View>

        {/* Tabel Barang */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text>Barang</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text>Harga (Rp)</Text>
            </View>
          </View>
          {transaction.detail_transaksi_penitipans && transaction.detail_transaksi_penitipans.length > 0 ? (
            transaction.detail_transaksi_penitipans.map((detail, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}>
                  <Text style={styles.textBold}>{detail.barang?.nama_barang || "Tidak diketahui"}</Text>
                  <Text>
                    Garansi ON{" "}
                    {detail.barang?.tanggal_garansi
                      ? new Date(detail.barang.tanggal_garansi).toLocaleString("id-ID", { dateStyle: "medium" })
                      : "-"}
                  </Text>
                  <Text>Berat barang: {detail.barang?.berat_barang || 0} kg</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{(detail.barang?.harga_barang || 0).toLocaleString("id-ID")}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text>Tidak ada detail barang</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>0</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.section}>
          <Text style={styles.textBold}>Ditermina dan QC oleh:</Text>
          <Text>{qcBy}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default NotaPenitipanPDF;