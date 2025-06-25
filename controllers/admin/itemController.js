const fs = require('fs');
const path = require('path');
const {db} = require('../../config/database');
const generateQrCode = require('../../utils/generateQr');
const {formatDate} = require('../../utils/dateFormatter');
const {format} = require('@fast-csv/format');

module.exports = {
    getAllItems: async (req, res) => {
        const departemenFilter = req.query.departemen || '';
        const searchQuery = req.query.search || '';

        try {
            const [departemenRows] = await db.execute(`SELECT DISTINCT departemen FROM items`);
            const daftarDepartemen = departemenRows.map(row => row.departemen);

            let whereClause = 'WHERE 1=1';
            const values = [];

            if (departemenFilter) {
                whereClause += " AND departemen = ?";
                values.push(departemenFilter);
            }

            if (searchQuery) {
                whereClause += " AND (nama LIKE ? OR lokasi LIKE ?)";
                values.push(`%${searchQuery}%`, `%${searchQuery}%`);
            }

            const [items] = await db.execute(`SELECT * FROM items ${whereClause}`, values)

            res.render('admin/items/list', {
                items,
                daftarDepartemen,
                departemen: departemenFilter,
                search: searchQuery
            });

        } catch (error) {
            res.status(500).send("Terjadi kesalahan: " + error.message);
        }
    },

    downloadItemsCSV: async (req, res) => {
        try {
            const [rows] = await db.execute(`SELECT * FROM items`);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=list_barang.csv');

            const csvStream = format({ headers: true });
            csvStream.pipe(res);

            rows.forEach((h, index) => {
                csvStream.write({
                    No: index + 1,
                    ID_barang: h.id,
                    Nama_Barang: h.nama,
                    Departemen: h.departemen,
                    Lokasi: h.lokasi,
                    Deskripsi: h.deskripsi,
                    Tanggal_Masuk: formatDate(h.tgl_masuk),
                    Status: h.status
                });
            });

            csvStream.end();
        } catch (err) {
            res.status(500).send('Gagal generate CSV: ' + err.message);
        }
    },

    getItemDetail: async (req, res) => {
        const {id} = req.params;
        try {
            const [rows] = await db.execute('SELECT * FROM items WHERE id = ?', [id]);

            if(rows.length  === 0) {
                return res.status(404).send('Item tidak ditemukan')
            }

            const item = {
                ...rows[0],
                tgl_masuk: formatDate(rows[0].tgl_masuk)
            }

            res.render('admin/items/detail', {item});
        } catch (error) {
            res.status(500).send('Terjadi kesalahan: ' + error.message);
        }
    },

    getInsertPage: (req, res) => {
        if(!req.session.user) {
            return res.redirect('/login');
        }
        res.render('admin/items/add', {error: null})
    },

    addItem: async (req, res) => {
        if(!req.session.user) {
            return res.redirect('/login')
        }
        const {id, nama, departemen, lokasi, deskripsi} = req.body;

        const qrCode = await generateQrCode(id);

        try {
            await db.execute(
                `INSERT INTO items (id, nama, departemen, lokasi, tgl_masuk, deskripsi, gambar) VALUES (?, ?, ?, ?, NOW(), ?, ?)`, [id, nama, departemen, lokasi, deskripsi, qrCode]
            );
            res.redirect('/admin/items/list');
        } catch (error) {
            res.status(500).send('Terjadi kesalahan: ' + error.message);
        }
    },

    getUpdateItem: async (req, res) => {
        const {id} = req.params;
        try {
            const [rows] = await db.execute(`SELECT * FROM items WHERE id = ?`, [id]);
            res.render('admin/items/update', {item: rows[0], error: null});
        } catch (error) {
            res.status(500).send('Terjadi kesalahan: ' + error.message);
        }
    },

    updateItem: async (req, res) => {
        const {id} = req.params;
        const {nama, departemen, lokasi, deskripsi} = req.body;

        try {
            await db.execute(`UPDATE items SET nama = ?, departemen = ?, lokasi = ?, deskripsi = ? WHERE id = ?`, [nama, departemen, lokasi, deskripsi, id]);

            res.redirect(`/admin/items/list/${id}`)
        } catch (error) {
            res.status(500).send('Terjadi kesalahan: ' + error.message);
        }
    },

    deleteItem: async (req, res) => {
        try {
            const {id} = req.params;

            const [rows] = await db.execute(`SELECT * FROM items WHERE id = ?`, [id]);

            if (rows.length === 0) {
                return res.status(404).json({message: `Item Tidak Ditemukan`})
            }

            const item = rows[0];

            if (item.gambar) {
                const imagePath = path.join(__dirname, 'public', 'img', 'items');
                if(fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await db.execute(`DELETE FROM items WHERE id = ?`, [id]);
            res.redirect('/admin/items/list');
        } catch (error) {
            res.status(500).send('Terjadi kesalahan: ' + error.message);
        }
    },

    getBorrowRequests: async (req, res) => {
        const page = Math.floor(parseInt(req.query.page)) || 1;
        const limit = 10;
        const offset = Math.floor((page -1) * limit);

        try {
            const [total] = await db.execute(`SELECT COUNT(*) as count FROM h_peminjaman WHERE status = 'pending_borrow'`);
            const totalRequest = total[0].count;
            
            const totalPages = Math.ceil(totalRequest / limit);
            const [rows] = await db.execute(
                `SELECT id, departemen, username, item_id, nama_barang, tgl_pinjam FROM h_peminjaman WHERE status = 'pending_borrow' LIMIT ${limit} OFFSET ${offset}`
            );
            const requests = rows.map(r => ({
                ...r,
                tgl_pinjam: formatDate(r.tgl_pinjam)
            }))            

            res.render('admin/items/borrow', { requests, page, totalPages, totalRequest });
        } catch (error) {
            res.status(500).send("Error: " + error.message);
        }
    },

    confirmBorrowRequest: async (req, res) => {
        const { id } = req.body;
        
        await db.execute(
            `UPDATE h_peminjaman SET tgl_pinjam = NOW(), status = 'dipinjam' WHERE id = ?`, [id]
        );
        res.redirect('/admin/items/borrow');
    },

    rejectBorrowRequest: async (req, res) => {
        const { id } = req.body;                
        await db.execute(`UPDATE h_peminjaman h JOIN items i ON h.item_id = i.id SET h.status = 'ditolak', i.status = 'tersedia' WHERE h.id = ?`, [id]);
        res.redirect('/admin/items/borrow');
    },

    getReturnRequests: async (req, res) => {
        const page = Math.floor(parseInt(req.query.page)) || 1;
        const limit = 10;
        const offset = Math.floor((page -1) * limit);

        try {
            const [total] = await db.execute("SELECT COUNT(*) as count FROM h_peminjaman WHERE status = 'pending_return'");
            const totalRequest = total[0].count;
            
            const totalPages = Math.ceil(totalRequest / limit);
            const [rows] = await db.execute(
                `SELECT * FROM h_peminjaman WHERE status = 'pending_return' LIMIT ${limit} OFFSET ${offset}`,
            );

            const requests = rows.map(r => ({
                ...r,
                tgl_pinjam: formatDate(r.tgl_pinjam),
                tgl_kembali: formatDate(r.tgl_kembali),
            }))            
            res.render('admin/items/return', { requests, page, totalPages, totalRequest });
        } catch (error) {
        res.status(500).send("Error: " + error.message);
        }
    },

    confirmReturnRequest: async (req, res) => {
        const { id } = req.body;

        await db.execute(`
            UPDATE h_peminjaman h
            JOIN items i ON h.item_id = i.id
            SET h.tgl_kembali = NOW(), h.status = 'dikembalikan', i.status = 'tersedia'
            WHERE h.id = ?
        `, [id]);
        
        res.redirect('/admin/items/return');
    },

    rejectReturnRequest: async (req, res) => {
        const { id } = req.body;
        
        await db.execute(`UPDATE h_peminjaman SET tgl_kembali = NULL, status = 'dipinjam' WHERE id = ?`, [id]);
        res.redirect('/admin/items/return');
    },
    getStoreRequests: async (req, res) => {
        const page = Math.floor(parseInt(req.query.page)) || 1;
        const limit = 10;
        const offset = Math.floor((page -1) * limit);

        try {
            const [total] = await db.execute(`SELECT COUNT(*) as count FROM h_penyimpanan WHERE permintaan = 'masuk' AND status = 'diproses'`);
            const totalRequest = total[0].count;
            
            const totalPages = Math.ceil(totalRequest / limit);
            const [rows] = await db.execute(
                `SELECT id, departemen, username, item_id, nama_barang, tanggal FROM h_penyimpanan WHERE permintaan = 'masuk' AND status = 'diproses' LIMIT ${limit} OFFSET ${offset}`
            );
            const requests = rows.map(r => ({
                ...r,
                tanggal: formatDate(r.tanggal)
            }))

            res.render('admin/items/storeRequest', { requests, page, totalPages, totalRequest });
        } catch (error) {
            res.status(500).send("Error: " + error.message);
        }
    },

    getFormStoreRequest: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await db.execute("SELECT id, nama_barang, departemen, deskripsi FROM h_penyimpanan WHERE id = ?", [id]);
            res.render('admin/items/formStoreRequest',  {item : rows[0], error: null})
        } catch (error) {
            res.status(500).send("Error: " + error.message);
        }
    },

    confirmStoreRequest: async (req, res) => {
        const historyId = req.params.id;        
        const {itemId, nama, departemen, lokasi, deskripsi } = req.body;

        const qrUrl = await generateQrCode(itemId);

        try {
            await db.execute(
                `INSERT INTO items (id, nama, departemen, lokasi, tgl_masuk, status, deskripsi, gambar) VALUES (?, ?, ?, ?, NOW(), 'tersedia', ?, ?)`,
                [itemId, nama, departemen, lokasi, deskripsi, qrUrl]
            );
            await db.execute(
                `UPDATE h_penyimpanan SET item_id = ?, status = 'disetujui' WHERE id = ?`, [itemId, historyId]
            );
            
            res.redirect('/admin/items/list');
        } catch (err) {
            res.status(500).send('Terjadi kesalahan: ' + err.message);
        }
    },
    rejectStoreRequest: async (req, res) => {
        const {historyId} = req.body;
        try {
            await db.execute(
                `UPDATE h_penyimpanan SET status = 'ditolak' WHERE id = ?`, [historyId]
            );
            res.redirect('/admin/items/store');
        } catch (err) {
            res.status(500).send('Terjadi kesalahan: ' + err.message);
        }
    },

    getTakeoverRequests: async (req, res) => {
        const page = Math.floor(parseInt(req.query.page)) || 1;
        const limit = 10;
        const offset = Math.floor((page -1) * limit);

        try {
            const [total] = await db.execute(`SELECT COUNT(*) as count FROM h_penyimpanan WHERE permintaan = 'keluar' AND status = 'diproses'`);
            const totalRequest = total[0].count;
            
            const totalPages = Math.ceil(totalRequest / limit);
            const [rows] = await db.execute(
                `SELECT id, departemen, username, item_id, nama_barang, tanggal FROM h_penyimpanan WHERE permintaan = 'keluar' AND status = 'diproses' LIMIT ${limit} OFFSET ${offset}`
            );
            const requests = rows.map(r => ({
                ...r,
                tanggal: formatDate(r.tanggal)
            }))

            res.render('admin/items/takeover', { requests, page, totalPages, totalRequest });
        } catch (error) {
            res.status(500).send("Error: " + error.message);
        }
    },

    confirmTakeoverRequest: async (req, res) => {
        const { id, itemId } = req.body;
        
        await db.execute(`UPDATE h_penyimpanan SET tanggal = NOW(), status = 'disetujui' WHERE id = ?`, [id]);
        await db.execute(`DELETE FROM items WHERE id = ?`, [itemId]);
        res.redirect('/admin/items/takeover');
    },

    rejectTakeoverRequest: async (req, res) => {
        const { id, itemId } = req.body;                
        await db.execute(`UPDATE h_penyimpanan SET status = 'ditolak' WHERE id = ?`, [id]);
        await db.execute(`UPDATE items SET status = 'tersedia' WHERE id = ?`, [itemId]);
        res.redirect('/admin/items/takeover');
    },
}