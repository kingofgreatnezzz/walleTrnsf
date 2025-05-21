// Logger utility for consistent logging across the application
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component
    };
  }

  private log(level: LogLevel, message: string, data?: any, component?: string) {
    const entry = this.formatMessage(level, message, data, component);
    this.logs.push(entry);
    
    // Keep logs array at a reasonable size
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Console output with styling
    const style = {
      info: 'color: #2196F3',
      warn: 'color: #FFA000',
      error: 'color: #F44336',
      debug: 'color: #4CAF50'
    }[level];

    console.log(
      `%c[${entry.timestamp}] [${level.toUpperCase()}] ${component ? `[${component}] ` : ''}${message}`,
      style
    );
    
    if (data) {
      console.log(data);
    }
  }

  info(message: string, data?: any, component?: string) {
    this.log('info', message, data, component);
  }

  warn(message: string, data?: any, component?: string) {
    this.log('warn', message, data, component);
  }

  error(message: string, data?: any, component?: string) {
    this.log('error', message, data, component);
  }

  debug(message: string, data?: any, component?: string) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data, component);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance(); 