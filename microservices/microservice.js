const { faker } = require("@faker-js/faker");
const winston = require("winston");
require("winston-daily-rotate-file");
const fs = require('fs');
const path = require('path');

// Ensure a writable logs directory exists (relative to project root)
const logsDir = path.join(process.cwd(), 'logs');
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (err) {
  // If creation fails, leave it to the transport to report an error later
  // (e.g., read-only file system). We avoid throwing here so the app can
  // surface the original error with context.
}

// Configure Daily Rotate File transport (writes into the project's ./logs)
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(
    logsDir,
    `${process.env.SERVICE_NAME || "service"}-%DATE%.log`
  ),
  datePattern: "YYYY-MM-DD-HH",
  maxsize: "20m",
  maxFiles: "5",
  format: winston.format.json(),
});

// Create Winston logger
const logger = winston.createLogger({
  level: "debug",
  /*   level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ), */
  transports: [
    fileRotateTransport,
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class LogGenerator {
  constructor() {
    if (process.env.SERVICE_NAME) {
      this.serviceNames = [process.env.SERVICE_NAME];
    } else {
      this.serviceNames = [
        "web-service",
        "auth-service",
        "user-service",
        "order-service",
        "inventory-service",
        "payment-service",
      ];
    }
    this._timer = null;
    this._stopped = false;
  }

  // Start generating logs periodically. This returns a Promise that only
  // resolves when the generator is stopped or the process exits.
  async start(intervalMs = 1000) {
    if (this._timer) return; // already started

    this._stopped = false;
    this._timer = setInterval(() => {
      const service = this.serviceNames[
        Math.floor(Math.random() * this.serviceNames.length)
      ];
      const level = ["info", "warn", "error", "debug"][
        Math.floor(Math.random() * 4)
      ];
      const message = faker.hacker.phrase();

      // Use the Winston logger defined above
      logger.log({ level, message, service, timestamp: new Date().toISOString() });
    }, intervalMs);

    // Return a promise that never resolves until stopped so `await start()` keeps the process alive
    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._stopped = true;
    if (this._resolve) this._resolve();
  }
}

async function main() {
  const logGenerator = new LogGenerator();
  try {
    await logGenerator.start();
  } catch (error) {
    console.error("Error running simulation:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

//Run the simulation
if (require.main === module) {
  main().catch(console.error);
}