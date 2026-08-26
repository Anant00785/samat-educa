const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;

async function getDb() {
    if (!dbPromise) {
        dbPromise = open({
            filename: path.join(__dirname, '../database.sqlite'),
            driver: sqlite3.Database
        });
        
        // Wait for connection to establish and enable foreign keys
        const db = await dbPromise;
        await db.run('PRAGMA foreign_keys = ON');
    }
    return dbPromise;
}

const poolWrapper = {
    execute: async (query, params = []) => {
        try {
            const db = await getDb();
            // Convert INSERT/UPDATE/DELETE queries to .run()
            const upperQuery = query.trim().toUpperCase();
            if (upperQuery.startsWith('SELECT')) {
                const rows = await db.all(query, params);
                return [rows, null]; // Mimic [rows, fields]
            } else {
                const result = await db.run(query, params);
                // Return result object mimicking mysql response
                return [{ insertId: result.lastID, affectedRows: result.changes }, null];
            }
        } catch (err) {
            console.error("DB Execute Error:", err.message);
            console.error("Query was:", query);
            console.error("Params were:", params);
            throw err;
        }
    },
    query: async (query, params = []) => {
        return await poolWrapper.execute(query, params);
    },
    getConnection: async () => {
        // Mock connection for transactions
        const db = await getDb();
        return {
            execute: poolWrapper.execute,
            beginTransaction: async () => await db.run('BEGIN TRANSACTION'),
            commit: async () => await db.run('COMMIT'),
            rollback: async () => await db.run('ROLLBACK'),
            release: () => {} // No-op for sqlite
        };
    }
};

module.exports = poolWrapper;
