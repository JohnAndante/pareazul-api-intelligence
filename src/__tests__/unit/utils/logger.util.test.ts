import { logger } from '../../../utils/logger.util';

describe('Logger Util', () => {
    it('should have logger instance', () => {
        // Assert
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.debug).toBe('function');
    });

    it('should log messages without errors', () => {
        // Act & Assert
        expect(() => {
            logger.info('Test info message');
            logger.error('Test error message');
            logger.warn('Test warning message');
            logger.debug('Test debug message');
        }).not.toThrow();
    });
});
