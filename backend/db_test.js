const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    try {
        console.log("Attempting to connect with user:", process.env.DB_USER, " Password:", process.env.DB_PASSWORD);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });
        console.log("Successfully connected to MySQL engine.");
        
        try {
            await connection.query('USE college_erp');
            console.log("Database 'college_erp' accessed.");
            const [rows] = await connection.query('SELECT COUNT(*) as count FROM Users');
            console.log(`Users table exists and has ${rows[0].count} users.`);
            
        } catch (dbErr) {
            console.error("Error with database or table:", dbErr.message);
        }
        
        process.exit(0);
    } catch(err) {
        console.error("Fatal Connection Error:");
        console.error("Code:", err.code);
        console.error("Number:", err.errno);
        console.error("State:", err.sqlState);
        console.error("Message:", err.message);
        process.exit(1);
    }
}

testConnection();
