const mongoose = require('mongoose')
const logger   = require('../utils/logger')


const connectDB = async () => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI not set in environment variables')
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
    })

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`)

    // ✅ Get collections
    const collections = await mongoose.connection.db.listCollections().toArray()

    logger.info(`📦 Total Collections: ${collections.length}`)

    collections.forEach(col => {
      logger.info(`➡️ ${col.name}`)
    })

    mongoose.connection.on('disconnected', () =>
      logger.warn('MongoDB disconnected. Attempting reconnect…')
    )

    mongoose.connection.on('reconnected', () =>
      logger.info('MongoDB reconnected')
    )

    return conn
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`)
    throw err
  }
}


// const connectDB = async () => {
//   const uri = process.env.MONGO_URI

//   if (!uri) {
//     throw new Error('MONGO_URI not set in environment variables')
//   }

//   try {
//     const conn = await mongoose.connect(uri, {
//       autoIndex: process.env.NODE_ENV !== 'production',
//     })

//     logger.info(`✅ MongoDB connected: ${conn.connection.host}`)

//     mongoose.connection.on('disconnected', () =>
//       logger.warn('MongoDB disconnected. Attempting reconnect…')
//     )
//     mongoose.connection.on('reconnected', () =>
//       logger.info('MongoDB reconnected')
//     )

//     return conn
//   } catch (err) {
//     logger.error(`MongoDB connection error: ${err.message}`)
//     throw err
//   }
// }

module.exports = connectDB
