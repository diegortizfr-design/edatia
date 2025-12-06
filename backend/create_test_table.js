require('dotenv').config({ path: './datos.env' });
// process.env.DB_HOST = '127.0.0.1'; // Removed forced connection
console.log('User:', process.env.DB_USER);
console.log('Host:', process.env.DB_HOST);
console.log('DB Name:', process.env.DB_NAME);
console.log('Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
const { createPool } = require('./config/db');

async function setupTestDB() {
    const pool = createPool();
    try {
        console.log('Creating table usuarios_bdtest...');
        // Create table based on usuarios structure (assuming usuarios exists)
        // If we don't know the exact structure of 'usuarios', we can try to copy it
        // Or create a standard structure

        // Let's try to copy structure from 'usuarios' if possible, or define a basic one matching the controller
        // Controller uses: nombre, email, password

        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios_bdtest (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table usuarios_bdtest created.');

        // Insert a test user
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('123456', 10);

        // Check if user exists
        const [rows] = await pool.query('SELECT * FROM usuarios_bdtest WHERE email = ?', ['test@bdtest.com']);
        if (rows.length === 0) {
            await pool.query('INSERT INTO usuarios_bdtest (nombre, email, password) VALUES (?, ?, ?)',
                ['Test User', 'test@bdtest.com', hashedPassword]);
            console.log('Test user created: test@bdtest.com / 123456');
        } else {
            console.log('Test user already exists.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

setupTestDB();
