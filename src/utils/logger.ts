import winston from 'winston';

export function sanitize(str: string): string {
  if (!str || typeof str !== 'string') return str;
  // Strip newlines and control characters
  return str.replace(/[\r\n\x00-\x1F\x7F]/g, '');
}

const sanitizeFormat = winston.format((info) => {
  const sanitizedInfo: any = { ...info };
  // Sanitize message if it's a string
  if (typeof sanitizedInfo.message === 'string') {
    sanitizedInfo.message = sanitize(sanitizedInfo.message);
  }
  // Traverse and sanitize all top-level string metadata
  for (const key in sanitizedInfo) {
    if (typeof sanitizedInfo[key] === 'string' && key !== 'message' && key !== 'level' && key !== 'timestamp') {
      sanitizedInfo[key] = sanitize(sanitizedInfo[key]);
    }
  }
  return sanitizedInfo;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    sanitizeFormat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'vectorify-mentorship-intelligence-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        sanitizeFormat(),
        winston.format.json()
      ),
    }),
  ],
});

export default logger;
