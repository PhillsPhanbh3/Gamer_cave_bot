const winston = require("winston");
const path = require("node:path");
const fs = require("node:fs/promises");

const today = new Date();
const logDir = path.join(__dirname, "..", "logs");

fs.mkdir(logDir, { recursive: true }).catch(console.error);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: "MM-DD-YYYY HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => `[Gamer Cave Bot] - [${timestamp}][${level}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      level: "error",
      filename: path.join(logDir, `${today.toISOString().split("T")[0]}.log`),
      lazy: true,
      handleExceptions: true,
      handleRejections: true,
      maxsize: 10 * 1024 * 1024
    })
  ],
  exitOnError: false,
});

module.exports = logger;
module.exports.logger = logger;