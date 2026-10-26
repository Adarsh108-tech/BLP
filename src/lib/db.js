import mongoose from 'mongoose';

const DB_NAME = 'bookleaf_portal';
const MONGODB_URI = process.env.MONGOURI;

function getDbUri() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGOURI environment variable inside .env.local');
  }
  let uri = MONGODB_URI;
  if (!uri.includes(DB_NAME)) {
    if (uri.includes('cluster0.evqkter.mongodb.net/')) {
      uri = uri.replace('cluster0.evqkter.mongodb.net/', `cluster0.evqkter.mongodb.net/${DB_NAME}`);
    } else {
      uri = uri.replace('cluster0.evqkter.mongodb.net', `cluster0.evqkter.mongodb.net/${DB_NAME}`);
    }
  }
  if (!uri.includes('retryWrites=')) {
    uri += (uri.includes('?') ? '&' : '?') + 'retryWrites=true&w=majority';
  }
  return uri;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      dbName: DB_NAME, // Strict database isolation for BookLeaf
    };

    const finalUri = getDbUri();
    cached.promise = mongoose.connect(finalUri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
