// src/controllers/calculator.controller.ts

import { Request, Response } from 'express';
import { calculatorService } from '../services/calculator.service';

export class CalculatorController {
  async calculate(req: Request, res: Response): Promise<void> {
    const { query } = req.body;

    try {
      const result = await calculatorService.calculate(query);
      res.json({ answer: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An internal server error occurred.';

      if (message.includes('Invalid query')) {
        res.status(400).json({ error: message });
      } else {
        res.status(500).json({ error: 'An internal server error occurred.' });
      }
    }
  }
}

export const calculatorController = new CalculatorController();
