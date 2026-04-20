/**
 * Centralized logging service for the World Labs MCP Bridge.
 * Bridges backend SSE logs and captures local frontend logs.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: 'backend' | 'frontend';
  logger?: string;
  metadata?: any;
}

type LogListener = (logs: LogEntry[]) => void;

class LogService {
  private logs: LogEntry[] = [];
  private listeners: LogListener[] = [];
  private maxLogs = 1000;
  private eventSource: EventSource | null = null;
  private isInitialized = false;

  constructor() {
    // We don't initialize immediately to avoid SSR issues if ever relevant,
    // and to ensure we're only running in the browser.
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.connectBackend();
    this.interceptConsole();
    this.interceptGlobalErrors();
    
    this.info('Frontend LogService initialized');
  }

  private connectBackend() {
    const url = '/api/logs/stream';
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data) as Omit<LogEntry, 'id'>;
        this.addEntry({
          ...entry,
          id: Math.random().toString(36).substring(2, 11),
        });
      } catch (err) {
        // Ignore malformed logs
      }
    };

    this.eventSource.onerror = () => {
      // Exponential backoff or simple retry could go here
      // For now, we'll just log it locally
      this.warn('Backend log stream disconnected. Retrying...');
    };
  }

  private interceptConsole() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      this.addFrontendEntry('INFO', args);
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      this.addFrontendEntry('WARN', args);
    };

    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      this.addFrontendEntry('ERROR', args);
    };

    console.debug = (...args: any[]) => {
      originalConsole.debug(...args);
      this.addFrontendEntry('DEBUG', args);
    };
  }

  private interceptGlobalErrors() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.error(`Uncaught Error: ${message}`, { source, lineno, colno, error });
    };

    window.onunhandledrejection = (event) => {
      this.error(`Unhandled Rejection: ${event.reason}`);
    };
  }

  private addFrontendEntry(level: LogLevel, args: any[]) {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
      .join(' ');

    this.addEntry({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      level,
      message,
      source: 'frontend',
    });
  }

  private addEntry(entry: LogEntry) {
    this.logs = [entry, ...this.logs].slice(0, this.maxLogs);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l(this.logs));
  }

  public subscribe(listener: LogListener) {
    this.listeners.push(listener);
    listener(this.logs);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public debug(message: string, metadata?: any) {
    this.addEntry({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      source: 'frontend',
      metadata,
    });
  }

  public info(message: string, metadata?: any) {
    this.addEntry({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      source: 'frontend',
      metadata,
    });
  }

  public warn(message: string, metadata?: any) {
    this.addEntry({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      source: 'frontend',
      metadata,
    });
  }

  public error(message: string, metadata?: any) {
    this.addEntry({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      source: 'frontend',
      metadata,
    });
  }

  public getLogs() {
    return this.logs;
  }

  public clear() {
    this.logs = [];
    this.notify();
  }
}

export const logger = new LogService();
