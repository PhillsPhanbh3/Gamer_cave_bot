const { connect, connection } = require("mongoose");
const logger = require("./logger");

async function connectToMongo() {
  const db = connection;

  db.on("error", (err) => logger.error(`[Database:mongo] An error occurred: ${err.message}`, err));
  db.on("disconnected", () => logger.warn(`[Database:mongo] disconnected`));
  db.on("reconnected", () => logger.info(`[Database:mongo] reconnected`));
  db.on("connected", () => logger.info(`[Database:mongo] connected to MongoDB`));

  try {
    await connect(process.env.MONGO_URL);
  } catch (error) {
    logger.error(`[Database:mongo] An error occurred while connecting`, error);
  }
}

async function dbPing() {
  if (!connection || !connection.db) {
    logger.error(`[Database:mongo] no connection available for ping`);
    return null;
  }
  try {
    const start = Date.now();
    await connection.db.admin().ping();
    return Date.now() - start;
  } catch (error) {
    logger.error(`[Database:mongo] ping failed`, error);
  }
}

module.exports = { connectToMongo, dbPing };