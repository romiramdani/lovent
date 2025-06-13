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
    }
}