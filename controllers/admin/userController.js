const db = require('../../config/database.js');
const bcrypt = require('bcrypt');

module.exports = {
    getAllusers: async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page -1) * limit;

        const search = req.query.search || '';
        const departemenFilter = req.query.departemen || '';

        try {
            const [departemenRows] = await db.execute(`SELECT DISTINCT departemen FROM users`);
            const daftarDepartemen = departemenRows.map(row => row.departemen);

            let whereClause = 'WHERE 1=1';
            const values = [];

            if(search) {
                whereClause += ` AND (nama LIKE ? OR username LIKE ?)`;
                values.push(`%${search}%`, `%${search}%`);
            }

            if(departemenFilter) {
                whereClause += ` AND departemen = ?`;
                values.push(departemenFilter);
            }

            const [countResult] = await db.execute(`SELECT COUNT(*) as count FROM users ${whereClause}`, values);
            const totalUsers = countResult[0].count;
            const totalPages = Math.ceil(totalUsers / limit);

            values.push(limit, offset);
            const [users] = await db.execute(`SELECT id, nama, username, departemen, role FROM users ${whereClause} LIMIT ? OFFSET ?`, values);

            res.render('admin/users/list', {
                users, 
                page, 
                totalPages, 
                totalUsers, 
                search, 
                departemen: departemenFilter,
                daftarDepartemen
            })

        } catch (error) {
            res.status(500).send("Error : " + error.message);
        }
    },
    getInsertPage: (req, res) => {
        res.render('admin/users/add', {error: null})
    },
    addUser: async (req, res) => {
        const {nama, username, password, confirmPassword, departemen, role } = req.body;

        try {
            if(!nama || !username || !password || !confirmPassword || !departemen || !role) {
                return res.render('admin/users/add', {error: 'Semua field harus diisi'});
            }
            if( password !== confirmPassword) {
                return res.render('admin/users/add', {error: 'Password dan Konfirmasi Password tidak cocok'})
            }

            const [rows] = await db.execute(`SELECT username FROM users WHERE username = ?`, [username]);

            if(rows.length > 0) {
                return res.render('admin/users/add', {error: 'Username sudah terdaftar'});
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await db.execute(`INSERT INTO users (nama, username, password, departemen, role) VALUES (?, ?, ?, ?,?)`, [nama, username, hashedPassword, departemen, role]);

            res.redirect('/admin/users/list');

        } catch (error) {
            res.status(500).send("Error: " + error.message);
            res.render('admin/users/add', {error: 'Terjadi Kesalahan'})
        }
    },
    getUpdatePage: async (req, res) => {
        const {id} = req.params;
        try {
            const [rows] = await db.execute(`SELECT * FROM users WHERE id = ?`, [id])
            res.render('admin/users/update', {user: rows[0], error: null})
        } catch (error) {
            res.status(500).send("Error: " + error.message);
        }
    },
    updateUser: async (req, res) => {
        const {id} = req.params;
        const {nama, username, departemen, password, role} = req.body;

        try {
            const [oldUser] = await db.execute(`SELECT password FROM users WHERE id = ?`, [id]);

            if(!oldUser || oldUser.length === 0) {
                return res.status(404).send('User not found');
            }

            let updatePassword = oldUser[0].password;

            if(password && password !== '') {
                updatePassword = await bcrypt.hash(password, 10);
            }

            await db.execute(`UPDATE users SET nama = ?, username = ?, password = ?, departemen = ?, role = ? WHERE id =  ? `, [nama, username, updatePassword, departemen, role, id]);
            res.redirect('/admin/users/list');

        } catch (error) {
            res.status(500).send("Error: " + error.message);
        }
    },
    deleteUser: async (req, res) => {
        const {id} = req.body;
                
        try {
            await db.execute(`DELETE FROM users WHERE id = ?`, [id]);
            res.redirect('/admin/users/list')
        } catch (error) {
            res.status(500).send("Error: " + error.message);
        }
    }
}