// MongoDB initialization script
db = db.getSiblingDB('dcloudx');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['walletAddress', 'username', 'email'],
      properties: {
        walletAddress: { bsonType: 'string' },
        username: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        role: { enum: ['provider', 'consumer', 'admin'] },
        reputation: { bsonType: 'number' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('resources', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['resourceId', 'provider', 'resourceType', 'cpu', 'ram', 'storage', 'pricePerHour'],
      properties: {
        resourceId: { bsonType: 'number' },
        provider: { bsonType: 'string' },
        resourceType: { bsonType: 'string' },
        cpu: { bsonType: 'number' },
        ram: { bsonType: 'number' },
        storage: { bsonType: 'number' },
        pricePerHour: { bsonType: 'number' },
        isActive: { bsonType: 'bool' },
        reputation: { bsonType: 'number' },
        metadata: { bsonType: 'object' },
        metrics: { bsonType: 'object' },
        sla: { bsonType: 'object' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('bookings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['resourceId', 'consumer', 'provider', 'startTime', 'endTime', 'duration', 'totalCost', 'status'],
      properties: {
        resourceId: { bsonType: 'number' },
        consumer: { bsonType: 'string' },
        provider: { bsonType: 'string' },
        startTime: { bsonType: 'date' },
        endTime: { bsonType: 'date' },
        duration: { bsonType: 'number' },
        totalCost: { bsonType: 'number' },
        status: { enum: ['pending', 'active', 'completed', 'cancelled'] },
        escrowId: { bsonType: 'number' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('transactions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['transactionHash', 'fromAddress', 'toAddress', 'amount', 'currency', 'type', 'status'],
      properties: {
        transactionHash: { bsonType: 'string' },
        fromAddress: { bsonType: 'string' },
        toAddress: { bsonType: 'string' },
        amount: { bsonType: 'number' },
        currency: { bsonType: 'string' },
        type: { enum: ['booking', 'refund', 'reward', 'penalty'] },
        status: { enum: ['pending', 'confirmed', 'failed'] },
        blockNumber: { bsonType: 'number' },
        timestamp: { bsonType: 'date' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('analytics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['metricName', 'value', 'timestamp'],
      properties: {
        metricName: { bsonType: 'string' },
        value: { bsonType: 'number' },
        timestamp: { bsonType: 'date' },
        resourceType: { bsonType: 'string' },
        region: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ walletAddress: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 });
db.users.createIndex({ reputation: -1 });

db.resources.createIndex({ resourceId: 1 }, { unique: true });
db.resources.createIndex({ provider: 1 });
db.resources.createIndex({ resourceType: 1 });
db.resources.createIndex({ pricePerHour: 1 });
db.resources.createIndex({ isActive: 1 });
db.resources.createIndex({ reputation: -1 });
db.resources.createIndex({ createdAt: -1 });

db.bookings.createIndex({ resourceId: 1 });
db.bookings.createIndex({ consumer: 1 });
db.bookings.createIndex({ provider: 1 });
db.bookings.createIndex({ status: 1 });
db.bookings.createIndex({ startTime: 1 });
db.bookings.createIndex({ endTime: 1 });
db.bookings.createIndex({ createdAt: -1 });

db.transactions.createIndex({ transactionHash: 1 }, { unique: true });
db.transactions.createIndex({ fromAddress: 1 });
db.transactions.createIndex({ toAddress: 1 });
db.transactions.createIndex({ type: 1 });
db.transactions.createIndex({ status: 1 });
db.transactions.createIndex({ blockNumber: 1 });
db.transactions.createIndex({ timestamp: -1 });

db.analytics.createIndex({ metricName: 1 });
db.analytics.createIndex({ timestamp: -1 });
db.analytics.createIndex({ resourceType: 1 });
db.analytics.createIndex({ region: 1 });
db.analytics.createIndex({ metricName: 1, timestamp: -1 });

// Create admin user
db.users.insertOne({
  walletAddress: '0x0000000000000000000000000000000000000000',
  username: 'admin',
  email: 'admin@dcloudx.com',
  password: '$2b$10$rQZ8K9vLxY2nM3pQ4rS5tO6uI7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9t',
  role: 'admin',
  reputation: 1000,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB initialization completed successfully!');
