import { DynamicStructuredTool } from '@langchain/core/tools';
import { userService } from '../services/user.service';
import {
    GetUserBalanceValidator,
    GetUserBalanceInput
} from '../validators/user.validator';

export const getUserBalanceTool = new DynamicStructuredTool({
    name: 'getUserBalance',
    description: 'Retrieves the balance of a user on a prefecture by their session.',
    schema: GetUserBalanceValidator,
    func: async (input: GetUserBalanceInput) => {
        const result = await userService.getUserBalance(input);
        return result.text;
    }
});

export const userTools = [
    getUserBalanceTool
];
