import { neon } from '@neondatabase/serverless';
import { hashSync } from 'bcryptjs';

// Get database connection
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

// Initialize database schema
export async function initializeDatabase() {
  const sql = getDb();
  
  // Create users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create evidence_items table
  await sql`
    CREATE TABLE IF NOT EXISTS evidence_items (
      id SERIAL PRIMARY KEY,
      case_number TEXT NOT NULL,
      item_number TEXT NOT NULL,
      description TEXT NOT NULL,
      collected_date DATE NOT NULL,
      collected_by TEXT NOT NULL,
      location TEXT,
      chain_of_custody TEXT,
      status TEXT DEFAULT 'stored',
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create audit_log table
  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id INTEGER,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Check if admin user exists
  const users = await sql`SELECT COUNT(*) as count FROM users`;
  const userCount = parseInt(users[0].count);
  
  if (userCount === 0) {
    const adminPassword = hashSync('admin123', 10);
    await sql`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES ('admin', ${adminPassword}, 'System Administrator', 'admin')
    `;
    console.log('Default admin user created: username=admin, password=admin123');
  }
}
