
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: any;
}

class Logger {
  private log(level: LogLevel, message: string, details: object = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...details,
    };
    console.log(JSON.stringify(entry));
  }

  info(message: string, details: object = {}) {
    this.log('INFO', message, details);
  }

  warn(message: string, details: object = {}) {
    this.log('WARN', message, details);
  }

  error(message: string, details: object = {}) {
    this.log('ERROR', message, details);
  }

  debug(message: string, details: object = {}) {
    this.log('DEBUG', message, details);
  }
}

export const logger = new Logger();
