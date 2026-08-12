const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD === 'YOUR_MYSQL_PASSWORD_HERE' ? '' : (process.env.DB_PASSWORD || '')
};

let pool = null;

async function initDb() {
  const dbName = process.env.DB_NAME || 'blood_bank_db';
  const isCloud = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

  try {
    if (!isCloud) {
      // Local only: create database if it doesn't exist
      const tempConnection = await mysql.createConnection(dbConfig);
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await tempConnection.end();
    }

    // Create connection pool
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined
    });

    await createTables();
    console.log(`Database "${dbName}" initialized and tables verified successfully.`);
    return true;
  } catch (err) {
    console.error('================================================================');
    console.error('DATABASE CONNECTION ERROR:');
    console.error(err.message);
    console.error('----------------------------------------------------------------');
    console.error('Please configure your database credentials in .env or Railway Variables.');
    console.error('The application will fall back to in-memory state until restarted.');
    console.error('================================================================');
    pool = null;
    return false;
  }
}

async function createTables() {
  const connection = await pool.getConnection();
  try {
    // Inventory table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        blood_type VARCHAR(5) PRIMARY KEY,
        units INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Donors table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS donors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        blood_type VARCHAR(5) NOT NULL,
        phone VARCHAR(50),
        city VARCHAR(100),
        last_donation_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital VARCHAR(255) NOT NULL,
        blood_type VARCHAR(5) NOT NULL,
        units INT NOT NULL DEFAULT 1,
        urgency ENUM('routine', 'urgent', 'critical') NOT NULL DEFAULT 'routine',
        status ENUM('pending', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'pending',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Seed initial inventory values if table is empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM inventory');
    if (rows[0].count === 0) {
      console.log('Seeding initial blood inventory...');
      const seedData = [
        ['A+', 18], ['A-', 6], ['B+', 14], ['B-', 4],
        ['O+', 22], ['O-', 3], ['AB+', 9], ['AB-', 2]
      ];
      for (const [type, units] of seedData) {
        await connection.query('INSERT INTO inventory (blood_type, units) VALUES (?, ?)', [type, units]);
      }
    }
  } finally {
    connection.release();
  }
}

// Wrapper query method that supports fallback if pool is not active
async function query(sql, params) {
  if (!pool) {
    throw new Error('Database is offline');
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

module.exports = {
  initDb,
  query,
  isOnline: () => pool !== null
};
