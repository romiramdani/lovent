const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// const caPath = path.resolve(process.cwd(), process.env.CA_CERT_PATH);
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // ssl: {
    //     ca: fs.readFileSync(caPath)
    // },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = {
    pool,
    db: pool.promise()
};
