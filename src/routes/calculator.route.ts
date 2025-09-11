// src/routes/calculator.route.ts

import { Router } from 'express';
import { calculatorController } from '../controllers/calculator.controller';

const router = Router();

router.post('/calculate', calculatorController.calculate.bind(calculatorController));

export default router;
