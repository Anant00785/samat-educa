const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log("Password we are using: '" + process.env.DB_PASSWORD + "'");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });
        console.log("Success!");
        process.exit(0);
    } catch(e) {
        console.error(e.message);
        process.exit(1);
    }
}
testConnection();
