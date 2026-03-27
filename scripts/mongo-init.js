// scripts/mongo-init.js
// Runs once when the MongoDB container is first created.
// Creates the billflow database and a dedicated app user.

db = db.getSiblingDB('billflow');

db.createUser({
  user: 'billflow_app',
  pwd:  'billflow_app_pass',     // override via MONGO_URI in production
  roles: [
    { role: 'readWrite', db: 'billflow' },
    { role: 'dbAdmin',   db: 'billflow' },
  ]
});

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password', 'role'],
      properties: {
        email: { bsonType: 'string', description: 'must be a string and is required' },
        role:  { enum: ['admin', 'staff'], description: 'must be admin or staff' }
      }
    }
  }
});

db.createCollection('products');
db.createCollection('sales');
db.createCollection('purchases');
db.createCollection('auditlogs');

// Indexes
db.users.createIndex({ email: 1 },    { unique: true });
db.products.createIndex({ tenantId: 1, sku: 1 }, { unique: true });
db.sales.createIndex({ tenantId: 1, date: -1 });
db.sales.createIndex({ invoiceNo: 1 }, { unique: true });
db.purchases.createIndex({ tenantId: 1, date: -1 });
db.auditlogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

print('✅ BillFlow DB initialized');
