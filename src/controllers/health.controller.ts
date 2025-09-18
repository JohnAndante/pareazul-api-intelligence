import { Request, Response } from 'express';

class HealthController {
    getHealth(req: Request, res: Response) {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'pareazul-api-intelligence',
        });
    }
}

export const healthController = new HealthController();
