const mongoose = require('mongoose');

const connectMongo = async () => {
  try {
    // mongoose v7+ does not require (and will reject) connection options
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Atlas connected ✅');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectMongo;