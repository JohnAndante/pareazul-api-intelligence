import { DynamicStructuredTool } from '@langchain/core/tools';
import { userService } from '../services/user.service';
import {
    GetUserBalanceSchema,
    GetUserBalanceInput
} from '../schemas/user.schema';

export const getUserBalanceTool = new DynamicStructuredTool({
    name: 'getUserBalance',
    description: 'Retrieves the balance of a user on a prefecture by their session.',
    schema: GetUserBalanceSchema,
    func: async (input: GetUserBalanceInput) => {
        const result = await userService.getUserBalance(input);
        return result.text;
    }
});

export const userTools = [
    getUserBalanceTool
];
