// MongoDB initialization script
db = db.getSiblingDB("comments_db");

// Create collections
db.createCollection("users");
db.createCollection("comments");
db.createCollection("files");

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.comments.createIndex({ createdAt: -1 });
db.comments.createIndex({ parentId: 1 });
db.comments.createIndex({ userId: 1 });
db.comments.createIndex({ text: "text" }); // For text search

db.files.createIndex({ commentId: 1 });
db.files.createIndex({ filename: 1 });

// Insert sample data (optional)
db.users.insertOne({
  _id: ObjectId(),
  username: "admin",
  email: "admin@example.com",
  password: "$2b$10$example.hash", // This should be properly hashed
  createdAt: new Date(),
  updatedAt: new Date(),
});

print("Database initialized successfully!");
