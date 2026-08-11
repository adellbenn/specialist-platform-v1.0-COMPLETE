const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');
const { v4: uuid } = require('uuid');

const db = new sqlite3.Database('data/platform.db');

const hash = bcrypt.hashSync('Test@123', 10);
const id = uuid();
const now = new Date().toISOString();

db.get("SELECT id FROM tenants LIMIT 1", (err, row) => {
  const tenantId = row?.id || null;

  db.run(
    `INSERT INTO "user" (id, email, firstName, lastName, role, password, tenantId, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, 'specialist@demo.com', 'أحمد', 'السعودي', 'specialist', hash, tenantId, now, now],
    (err2) => {
      if (err2) {
        console.error('Error:', err2.message);
      } else {
        console.log('✅ Specialist created: specialist@demo.com / Test@123');
      }
      db.close();
    }
  );
});
