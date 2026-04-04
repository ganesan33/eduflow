const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Cosmos DB specific options
    const options = {
      retryWrites: false,  // Cosmos DB doesn't support retryable writes
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('Azure Cosmos DB connected');
  } catch (error) {
    console.error('Cosmos DB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
