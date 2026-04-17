// MongoDB connection utility
// Optimized for development/hackathon environment (single instance, reusable client)

const { MongoClient } = require('mongodb');

// Connection configuration following best practices for demo/hackathon environments
const mongoConfig = {
  url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  dbName: process.env.DB_NAME || 'logistics_optimization',
  
  // Connection pool optimized for development (small pool, quick responses)
  options: {
    maxPoolSize: 5,           // Small pool for development
    minPoolSize: 1,           // Minimal connections at startup
    maxIdleTimeMS: 30000,     // Close idle connections after 30s
    connectTimeoutMS: 5000,   // Fail fast if can't connect
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true,
  }
};

let mongoClient = null;
let db = null;

/**
 * Connect to MongoDB
 * Creates a single reusable connection for the application
 */
async function connectDB() {
  try {
    if (mongoClient && mongoClient.topology && mongoClient.topology.isConnected()) {
      console.log('✓ Using existing MongoDB connection');
      return db;
    }

    console.log(`🔌 Connecting to MongoDB: ${mongoConfig.url}/${mongoConfig.dbName}`);
    
    mongoClient = new MongoClient(mongoConfig.url, mongoConfig.options);
    await mongoClient.connect();
    
    db = mongoClient.db(mongoConfig.dbName);
    
    // Test connection
    const adminDb = db.admin();
    const status = await adminDb.ping();
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoConfig.dbName}`);
    
    return db;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Get MongoDB database instance
 */
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

/**
 * Get MongoDB client instance
 */
function getClient() {
  if (!mongoClient) {
    throw new Error('MongoDB client not initialized. Call connectDB() first.');
  }
  return mongoClient;
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  try {
    if (mongoClient) {
      await mongoClient.close();
      console.log('🔌 MongoDB disconnected');
      mongoClient = null;
      db = null;
    }
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
}

/**
 * Initialize collections with schema validation
 */
async function initializeCollections() {
  const database = getDB();
  
  try {
    // Warehouses collection
    await database.createCollection('warehouses', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'name', 'location', 'capacity'],
          properties: {
            _id: { bsonType: 'objectId' },
            id: { bsonType: 'string' },
            name: { bsonType: 'string' },
            location: {
              bsonType: 'object',
              properties: {
                city: { bsonType: 'string' },
                state: { bsonType: 'string' },
                lat: { bsonType: 'double' },
                lon: { bsonType: 'double' }
              }
            },
            capacity: { bsonType: 'int' },
            costPerDay: { bsonType: 'double' },
            failureRate: { bsonType: 'double' },
            currentStock: { bsonType: 'array' },
            createdAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {}); // Collection might already exist

    // Customers collection
    await database.createCollection('customers', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'name', 'location'],
          properties: {
            _id: { bsonType: 'objectId' },
            id: { bsonType: 'string' },
            name: { bsonType: 'string' },
            location: {
              bsonType: 'object',
              properties: {
                city: { bsonType: 'string' },
                state: { bsonType: 'string' },
                lat: { bsonType: 'double' },
                lon: { bsonType: 'double' }
              }
            },
            type: { bsonType: 'string' },
            createdAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {});

    // Orders collection
    await database.createCollection('orders', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'customerId', 'productId', 'quantity', 'requiredDate'],
          properties: {
            _id: { bsonType: 'objectId' },
            id: { bsonType: 'string' },
            customerId: { bsonType: 'string' },
            productId: { bsonType: 'string' },
            quantity: { bsonType: 'int' },
            status: { enum: ['pending', 'assigned', 'shipped', 'delivered', 'failed'] },
            requiredDate: { bsonType: 'date' },
            allocatedWarehouse: { bsonType: 'string' },
            cost: { bsonType: 'double' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {});

    // Demand history collection
    await database.createCollection('demandHistory', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['customerId', 'productId', 'date', 'demand'],
          properties: {
            _id: { bsonType: 'objectId' },
            customerId: { bsonType: 'string' },
            productId: { bsonType: 'string' },
            date: { bsonType: 'date' },
            demand: { bsonType: 'int' }
          }
        }
      }
    }).catch(() => {});

    // Orders history collection
    await database.createCollection('ordersHistory', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'customerId', 'productId'],
          properties: {
            _id: { bsonType: 'objectId' },
            id: { bsonType: 'string' },
            customerId: { bsonType: 'string' },
            productId: { bsonType: 'string' },
            quantity: { bsonType: 'int' },
            status: { bsonType: 'string' },
            allocatedWarehouse: { bsonType: 'string' },
            cost: { bsonType: 'double' },
            createdAt: { bsonType: 'date' },
            completedAt: { bsonType: 'date' }
          }
        }
      }
    }).catch(() => {});

    // Create indexes for performance
    const collections = {
      warehouses: [{ id: 1 }],
      customers: [{ id: 1 }],
      orders: [
        { id: 1 },
        { customerId: 1 },
        { status: 1 },
        { requiredDate: 1 }
      ],
      demandHistory: [
        { customerId: 1, date: 1 },
        { productId: 1, date: 1 }
      ],
      ordersHistory: [
        { id: 1 },
        { customerId: 1 },
        { status: 1 }
      ]
    };

    for (const [collName, indexes] of Object.entries(collections)) {
      const coll = database.collection(collName);
      for (const indexSpec of indexes) {
        try {
          await coll.createIndex(indexSpec);
        } catch (err) {
          // Index might already exist
        }
      }
    }

    console.log('✓ Collections and indexes initialized');
    
  } catch (error) {
    console.error('Error initializing collections:', error.message);
    throw error;
  }
}

module.exports = {
  connectDB,
  getDB,
  getClient,
  disconnectDB,
  initializeCollections,
  mongoConfig
};
