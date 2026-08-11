import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

function devFormat() {
  return combine(
    colorize({ all: true }),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp: ts, level, message, context, stack }) => {
      const ctx = context ? `[${context}]` : '';
      const trace = stack ? `\n${stack}` : '';
      return `${ts} ${level} ${ctx} ${message}${trace}`;
    }),
  );
}

function prodFormat() {
  return combine(timestamp(), errors({ stack: true }), json());
}

export function createWinstonOptions() {
  const isProd = process.env.NODE_ENV === 'production';

  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: isProd ? 'info' : 'debug',
    }),
  ];

  if (isProd) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        level: 'info',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10,
      }),
    );
  }

  return {
    transports,
    format: isProd ? prodFormat() : devFormat(),
  };
}
