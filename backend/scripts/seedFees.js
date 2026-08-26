const db = require('../config/db');

async function seedFees() {
    try {
        console.log("Checking and seeding fee records...");
        const [existing] = await db.execute('SELECT * FROM Fees');
        console.log(`Found ${existing.length} existing fee records.`);

        // Ensure Ritu Patel (PRN000) has a PENDING Semester 5 fee
        const [rituFees] = await db.execute('SELECT * FROM Fees WHERE prn = ?', ['PRN000']);
        if (rituFees.length === 0) {
            await db.execute(`
                INSERT INTO Fees (prn, amount, total_amount, paid_amount, semester, due_date, status, description)
                VALUES ('PRN000', 50000, 50000, 0, 5, '2026-09-30', 'PENDING', 'Semester 5 Tuition & Lab Fee')
            `);
            console.log("Seeded PRN000 (Ritu Patel) - PENDING ₹50,000");
        } else {
            // Update to have full fields
            await db.execute(`
                UPDATE Fees
                SET total_amount = 50000, paid_amount = 0, semester = 5, due_date = '2026-09-30', status = 'PENDING', description = 'Semester 5 Tuition & Lab Fee'
                WHERE prn = 'PRN000' AND fee_id = ?
            `, [rituFees[0].fee_id]);
            console.log("Updated PRN000 (Ritu Patel) - PENDING ₹50,000");
        }

        // Ensure Aman Das (PRN001) has PARTIALLY_PAID
        const [amanFees] = await db.execute('SELECT * FROM Fees WHERE prn = ?', ['PRN001']);
        if (amanFees.length === 0) {
            await db.execute(`
                INSERT INTO Fees (prn, amount, total_amount, paid_amount, semester, due_date, status, description)
                VALUES ('PRN001', 50000, 50000, 20000, 5, '2026-09-30', 'PARTIALLY_PAID', 'Semester 5 Tuition & Lab Fee')
            `);
            console.log("Seeded PRN001 (Aman Das) - PARTIALLY_PAID ₹20,000/₹50,000");
        }

        // Ensure Priya Nair (PRN002) has PAID
        const [priyaFees] = await db.execute('SELECT * FROM Fees WHERE prn = ?', ['PRN002']);
        if (priyaFees.length === 0) {
            await db.execute(`
                INSERT INTO Fees (prn, amount, total_amount, paid_amount, semester, due_date, status, description, receipt_number)
                VALUES ('PRN002', 48000, 48000, 48000, 5, '2026-08-15', 'PAID', 'Semester 5 Tuition & Examination Fee', 'HC-FEE-2026-00018')
            `);
            console.log("Seeded PRN002 (Priya Nair) - PAID ₹48,000");
        }

        // Ensure Sneha Patil (PRN004) has OVERDUE
        const [snehaFees] = await db.execute('SELECT * FROM Fees WHERE prn = ?', ['PRN004']);
        if (snehaFees.length === 0) {
            await db.execute(`
                INSERT INTO Fees (prn, amount, total_amount, paid_amount, semester, due_date, status, description)
                VALUES ('PRN004', 52000, 52000, 0, 5, '2026-07-31', 'PENDING', 'Semester 5 Tuition & Lab Fee')
            `);
            console.log("Seeded PRN004 (Sneha Patil) - OVERDUE (due 2026-07-31)");
        }

        console.log("Fee seeding complete!");
    } catch (e) {
        console.error("Seeding error:", e);
    }
}

seedFees();
