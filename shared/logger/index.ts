import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : undefined;
            return metaStr ? `${timestamp} ${level}: ${message} ${metaStr}` : `${timestamp} ${level}: ${message}`;
        })
    ),
    defaultMeta: {},
    transports: [new winston.transports.Console()],
});

export default logger;
export { logger as WinstonLogger };