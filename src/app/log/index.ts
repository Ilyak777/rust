import { createLogger, format, transports, Logger } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

class CustomLogger {
  private consoleLogger: Logger;
  private fileLogger: Logger;

  constructor() {
    this.consoleLogger = createLogger({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
      transports: [new transports.Console()],
    });

    this.fileLogger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
      transports: [
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  logToConsole(level: string, message: string): void {
    this.consoleLogger.log({ level, message });
  }

  logToFile(level: string, message: string): void {
    this.fileLogger.log({ level, message });
  }

  debug(message: string): void {
    this.logToConsole('debug', message);
  }

  info(message: string): void {
    this.logToConsole('info', message);
    this.logToFile('info', message);
  }

  warn(message: string): void {
    this.logToConsole('warn', message);
    this.logToFile('warn', message);
  }

  error(message: string): void {
    this.logToConsole('error', message);
    this.logToFile('error', message);
  }
}

const logger = new CustomLogger();
export default logger;
