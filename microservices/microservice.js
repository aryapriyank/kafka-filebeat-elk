const { faker } = require("@faker-js/faker");
const winston = require("winston");
require("winston-daily-rotate-file");

// Configure Daily Rotate File transport
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: `/logs/${process.env.SERVICE_NAME || "service"}-%DATE%.log`,
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