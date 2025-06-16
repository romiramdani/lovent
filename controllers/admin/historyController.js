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
}