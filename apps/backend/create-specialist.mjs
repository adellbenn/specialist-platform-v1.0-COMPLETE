import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

const db = new Database('data/platform.db');
const hash = bcrypt.hashSync('Test@123', 10);
const id = uuid();
const now = new Date().toISOString();

// Get first tenant (center)
const tenant = db.prepare("SELECT id FROM tenants LIMIT 1").get();
const tenantId = tenant?.id || null;

db.prepare(`
  INSERT INTO "user" (id, email, firstName, lastName, role, password, tenantId, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
`).run(id, 'specialist@demo.com', 'أحمد', 'السعودي', 'specialist', hash, tenantId, now, now);

console.log('✅ Specialist created: specialist@demo.com / Test@123');
db.close();
