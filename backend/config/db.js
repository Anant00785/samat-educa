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

        // Ensure Interventions table exists
        await db.run(`
            CREATE TABLE IF NOT EXISTS Interventions (
                intervention_id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_prn VARCHAR(20) NOT NULL,
                risk_score INTEGER NOT NULL,
                risk_level VARCHAR(20) NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                reason TEXT NOT NULL,
                owner_role VARCHAR(20) NOT NULL,
                owner_name VARCHAR(100),
                priority VARCHAR(20) CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'HIGH',
                status VARCHAR(20) CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED')) DEFAULT 'PENDING',
                due_date DATE NOT NULL,
                action_type VARCHAR(50) DEFAULT 'RECOVERY_PLAN',
                completed_at TIMESTAMP,
                outcome TEXT,
                outcome_score INTEGER,
                created_by VARCHAR(50) DEFAULT 'HyperIntervene AI',
                timeline_json TEXT,
                metadata_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_prn) REFERENCES Students(prn) ON DELETE CASCADE
            )
        `);

        // Ensure Fee_Payments table exists
        await db.run(`
            CREATE TABLE IF NOT EXISTS Fee_Payments (
                payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                fee_id INTEGER NOT NULL,
                student_prn VARCHAR(20) NOT NULL,
                paid_by_user_id INTEGER NOT NULL,
                payer_role VARCHAR(20) DEFAULT 'STUDENT',
                razorpay_order_id VARCHAR(100) UNIQUE,
                razorpay_payment_id VARCHAR(100) UNIQUE,
                razorpay_signature VARCHAR(255),
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                status VARCHAR(20) CHECK(status IN ('CREATED', 'CAPTURED', 'FAILED', 'REFUNDED')) DEFAULT 'CREATED',
                payment_method VARCHAR(50) DEFAULT 'RAZORPAY_CHECKOUT',
                receipt_number VARCHAR(50) UNIQUE,
                paid_at TIMESTAMP,
                metadata_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (fee_id) REFERENCES Fees(fee_id) ON DELETE CASCADE,
                FOREIGN KEY (student_prn) REFERENCES Students(prn) ON DELETE CASCADE
            )
        `);

        // Migrate Fees columns if needed (for semester, total_amount, paid_amount)
        try {
            const columns = await db.all("PRAGMA table_info(Fees)");
            const colNames = columns.map(c => c.name);
            if (!colNames.includes('semester')) await db.run("ALTER TABLE Fees ADD COLUMN semester INTEGER DEFAULT 5");
            if (!colNames.includes('academic_year')) await db.run("ALTER TABLE Fees ADD COLUMN academic_year VARCHAR(20) DEFAULT '2025-2026'");
            if (!colNames.includes('total_amount')) await db.run("ALTER TABLE Fees ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 50000");
            if (!colNames.includes('paid_amount')) await db.run("ALTER TABLE Fees ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0");
            if (!colNames.includes('description')) await db.run("ALTER TABLE Fees ADD COLUMN description VARCHAR(200) DEFAULT 'Semester Tuition & Lab Fee'");
            if (!colNames.includes('receipt_number')) await db.run("ALTER TABLE Fees ADD COLUMN receipt_number VARCHAR(50)");
        } catch (e) {
            console.log("Fees column migration info:", e.message);
        }
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
