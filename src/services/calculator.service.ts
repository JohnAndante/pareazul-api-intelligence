import { invokeCalculatorAgent } from '../agents/calculator/calculator.index';

export class CalculatorService {
  async calculate(query: string): Promise<string> {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query. Must be a non-empty string.');
    }

    try {
      const result = await invokeCalculatorAgent(query);
      return result;
    } catch (error) {
      console.error('[CalculatorService] Error:', error);
      throw new Error('Failed to process calculation');
    }
  }
}

export const calculatorService = new CalculatorService();
