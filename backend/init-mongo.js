// MongoDB initialization script
db = db.getSiblingDB('agri_ai');

// Create collections
db.createCollection('users');
db.createCollection('otps');

// Create indexes for better performance
db.users.createIndex({ "phone_number": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { sparse: true });
db.users.createIndex({ "created_at": 1 });

db.otps.createIndex({ "phone_number": 1 });
db.otps.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });
db.otps.createIndex({ "created_at": 1 });

print('Database initialized successfully!');
