const {format} = require('@fast-csv/format');
const db = require('../../config/database.js');
const {formatDate} = require('../../utils/dateFormatter.js');

module.exports = {
    getStoreHistory: async (req, res) => {
        const [rows] = await db.query(`SELECT * FROM h_penyimpanan`);

        const history = rows.map(h => ({
            ...h,
            tanggal: formatDate(h.tanggal),
        }))
            
        res.render('admin/history/store', { history });
    },

    downloadStoreHistoryCSV: async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT * FROM h_penyimpanan`);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=riwayat_penyimpanan.csv');

            const csvStream = format({ headers: true });
            csvStream.pipe(res);

            rows.forEach((h, index) => {
                csvStream.write({
                    No: index + 1,
                    Username: h.username,
                    Departemen: h.departemen,
                    ID_Barang: h.item_id,
                    Nama_Barang: h.nama_barang,
                    Deskripsi: h.deskripsi,
                    Tanggal: formatDate(h.tanggal),
                    Permintaan: h.permintaan,
                    Status: h.status
                });
            });

            csvStream.end();
        } catch (err) {
            res.status(500).send('Gagal generate CSV: ' + err.message);
        }
    },

    getBorrowHistory: async (req, res) => {
        const [rows] = await db.query(`SELECT * FROM h_peminjaman`);

        const history = rows.map(h => ({
            ...h,
            tgl_pinjam: formatDate(h.tgl_pinjam),
            tgl_kembali: formatDate(h.tgl_kembali),
        }))
            
        res.render('admin/history/borrow', { history });
    },
    downloadBorrowHistoryCSV: async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT * FROM h_peminjaman`);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=riwayat_peminjaman.csv');

            const csvStream = format({ headers: true });
            csvStream.pipe(res);

            rows.forEach((h, index) => {
                csvStream.write({
                    No: index + 1,
                    Username: h.username,
                    Departemen: h.departemen,
                    ID_Barang: h.item_id,
                    Nama_Barang: h.nama_barang,
                    Tanggal_Peminjaman: formatDate(h.tgl_pinjam),
                    Tanggal_Pengembalian: formatDate(h.tgl_kembali),
                    Status: h.status
                });
            });

            csvStream.end();
        } catch (err) {
            res.status(500).send('Gagal generate CSV: ' + err.message);
        }
    },
}