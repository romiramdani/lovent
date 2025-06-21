const db = require('../../config/database.js');
const {formatDate} = require('../../utils/dateFormatter.js')

module.exports = {
    getItems: async (req, res) => {
        const {departemen} = req.session.user;
        
        const [items] = await db.query(`SELECT * FROM items WHERE departemen = ?`, [departemen]);
        
        res.render('client/items', { items });
    },

    getItemDetail : async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return res.status(404).send('Barang tidak ditemukan');
            }
            const item = {
                ...rows[0],
                tgl_masuk: formatDate(rows[0].tgl_masuk)
            }  
    
            res.render('client/detail', { item });
        } catch (err) {
            res.status(500).send('Terjadi kesalahan: ' + err.message);
        }
    
    },

    borrowItem: async (req, res) => {
        const { itemId } = req.body;
        const userId = req.session.user.id;
        const {username, departemen} = req.session.user;
        
        const [item] = await db.query('SELECT nama FROM items WHERE id = ?', [itemId]);
        
        if (item.length > 0) {
            await db.query(`
                INSERT INTO h_peminjaman (user_id, username, departemen, item_id, nama_barang, tgl_pinjam, status)
                VALUES (?, ?, ?, ?, ?, NOW(), 'pending_borrow')
            `, [userId, username, departemen, itemId, item[0].nama]);
            
            await db.query(`UPDATE items SET status = 'dipinjam' WHERE id = ?`, [itemId]);
    
            res.redirect(`/items/list/${itemId}`);
        } else {
            res.status(400).send('Barang tidak tersedia');
        }
    },

    getBorrowedItems: async (req, res) => {
        const userId = req.session.user.id;
    
        const [rows] = await db.query(`SELECT id, item_id, nama_barang, tgl_pinjam FROM h_peminjaman WHERE user_id = ? AND status = 'dipinjam'`, [userId]);
        const borrowedItems = rows.map(b => ({
            ...b,
            tgl_pinjam: formatDate(b.tgl_pinjam)
        }))

        res.render('client/borrowed', { borrowedItems });
    },

    returnItem: async (req, res) => {
        const { historyId } = req.body;

        await db.execute(`UPDATE h_peminjaman SET tgl_kembali = NOW(), status = 'pending_return' WHERE id = ?`, [historyId]);
    
        res.redirect('/items/borrowed');
    },

    getBorrowHistory: async (req, res) => {
        const userId = req.session.user.id;
    
        try {
            const [rows] = await db.query('SELECT * FROM h_peminjaman WHERE user_id = ? ORDER BY tgl_pinjam ASC', [userId] );
            const history = rows.map(h => ({
                ...h,
                tgl_pinjam: formatDate(h.tgl_pinjam),
                tgl_kembali: formatDate(h.tgl_kembali),
            }))
            
            res.render('client/borrowHistory', { history });
        } catch (err) {
            res.status(500).send('Terjadi kesalahan: ' + err.message);
        }
    },

    getStoreHistory: async (req, res) => {
        const userId = req.session.user.id;
    
        try {
            const [rows] = await db.query('SELECT * FROM h_penyimpanan WHERE user_id = ? ORDER BY tanggal ASC', [userId] );
            const history = rows.map(h => ({
                ...h,
                tanggal: formatDate(h.tanggal),
            }))
            
            res.render('client/storeHistory', { history });
        } catch (err) {
            res.status(500).send('Terjadi kesalahan: ' + err.message);
        }
    },
    getStoreItem: async (req, res) => {
        res.render('client/store', { error: null });
    },

    storeItem: async (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const {nama, deskripsi} = req.body;
        
        const userId = req.session.user.id;
        const {username, departemen} = req.session.user;

        try {

            await db.query(`
                INSERT INTO h_penyimpanan (user_id, username, departemen, nama_barang, deskripsi, tanggal, permintaan, status)
                VALUES (?, ?, ?, ?, ?, NOW(), 'masuk', 'diproses')
            `, [userId, username, departemen, nama, deskripsi]);
                res.redirect('/items/history/store');
        } catch (err) {
            res.status(500).send('Terjadi kesalahan: ' + err.message);
        }
    },
}