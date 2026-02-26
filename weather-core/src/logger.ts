import fs from "fs";
import path from "path";
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
  addColors,
} from "winston";

export interface AppLogger extends WinstonLogger {
  trace(message: string, meta?: any): WinstonLogger;
}

const isTest = process.env.NODE_ENV === "test";
const logDir = path.resolve("./logs");

// ensure logs directory exists (not in test mode)
if (!isTest && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// custom levels including trace
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  },
};

// custom colors for those levels
const customColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue",
  trace: "grey",
};

addColors(customColors);

// shared base formatter
const baseFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, module, ...meta }) => {
    const metaString =
      Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
    return `${timestamp} [${level}]${
      module ? ` [${module}]` : ""
    } ${message} ${metaString}`;
  })
);

const baseLogger: AppLogger = createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL ?? "trace",
  format: baseFormat,
  transports: isTest
    ? [
        // silent transport in test mode (prevents Winston warnings)
        new transports.Console({ silent: true }),
      ]
    : [
        new transports.Console({
          format: format.combine(
            format.colorize({ all: true }),
            baseFormat
          ),
        }),
        new transports.File({
          filename: path.join(logDir, "app.log"),
        }),
      ],
}) as AppLogger;

// module-specific logger
export function getLogger(module: string): AppLogger {
  return baseLogger.child({ module }) as AppLogger;
}

export default baseLogger;