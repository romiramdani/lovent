const fs = require('fs');
const path = require('path');
const db = require('../../config/database');
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
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Jumlah data per halaman
        const offset = (page - 1) * limit;

        try {
            const [total] = await db.execute(`SELECT COUNT(*) as count FROM h_peminjaman WHERE status = 'pending_borrow'`);
            const totalRequest = total[0].count;
            
            const totalPages = Math.ceil(totalRequest / limit);
            const [rows] = await db.execute(
                `SELECT id, departemen, username, item_id, nama_barang, tgl_pinjam FROM h_peminjaman WHERE status = 'pending_borrow' LIMIT ? OFFSET ?`, [limit, offset]
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
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        try {
            const [total] = await db.execute("SELECT COUNT(*) as count FROM h_peminjaman WHERE status = 'pending_return'");
            const totalRequest = total[0].count;
            
            const totalPages = Math.ceil(totalRequest / limit);
            const [rows] = await db.execute(
                `SELECT * FROM h_peminjaman WHERE status = 'pending_return' LIMIT ? OFFSET ?`, [limit, offset]
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
}