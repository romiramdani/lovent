const {db} = require('../../config/database');

module.exports = {
    getHomePage: async (req, res) => {
        try {            
            if (!req.session.user) {
                    return res.redirect('/login');         
            }
            const {departemen} = req.session.user

            const [totalUser] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 2");
            const users = totalUser[0].count;

            const [totalItem] = await db.query("SELECT COUNT(*) as count FROM items WHERE departemen = ?", [departemen]);
            const items = totalItem[0].count;
            
            const [totalRequest] = await db.query(`SELECT SUM(count) AS total_pending FROM (SELECT COUNT(*) AS count FROM h_peminjaman WHERE status LIKE 'pending%' UNION ALL SELECT COUNT(*) AS count FROM h_penyimpanan WHERE status LIKE 'pending%') AS combined`);
            const request = totalRequest[0].total_pending;

            const [totalBorrow] = await db.query(`SELECT COUNT(*) as count FROM items WHERE status = 'dipinjam' AND departemen = ?`, [departemen]);
            const borrowed = totalBorrow[0].count;
            res.render('client/index', {items, request, borrowed, })
        } catch (error) {
            return res.redirect('/login');         
        }
    }
}