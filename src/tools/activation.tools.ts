import { DynamicStructuredTool } from '@langchain/core/tools';
import { activationService } from '../services/activation.service';
import {
    CheckVehicleActivationSchema,
    RegisterVehicleActivationSchema,
    CheckVehicleActivationInput,
    RegisterVehicleActivationInput
} from '../schemas/activation.schema';

export const checkVehicleCurrentActivationsTool = new DynamicStructuredTool({
    name: 'checkVehicleCurrentActivations',
    description: 'Verify if a vehicle is activated in the current prefecture.',
    schema: CheckVehicleActivationSchema,
    func: async (input: CheckVehicleActivationInput) => {
        const result = await activationService.checkCurrentVehicleActivation(input);
        return result.text;
    }
});

export const registerVehicleActivationTool = new DynamicStructuredTool({
    name: 'registerVehicleActivation',
    description: 'Registers a vehicle activation for a user, using the user\'s balance. ' +
        'Required information: vehicle plate and time rule ID from prefecture zone rules. ' +
        'Process internally: use getUserVehicles, getPrefectureZones, getPrefectureZoneRules, ' +
        'and optionally checkVehicleCurrentActivations to gather all data. ' +
        'IMPORTANT: Before activation, verify that the current time is within prefecture operating hours ' +
        'using the operating hours data from getPrefectureZoneRules. If outside operating hours, ' +
        'inform the user that activation is not allowed at this time and show the valid operating hours. ' +
        'Present complete activation options with prices in a single response, and ask the user to confirm their choice. ' +
        'For extensions, set \'extend\' parameter to true if vehicle is already activated, and provide the previous activation ID. ' +
        'You can retrieve the previous activation ID using the \'checkVehicleCurrentActivations\' tool. ' +
        'When extending an activation, check if the prefecture maximum activation time is reached, or will be reached with the new activation. ' +
        'If the maximum activation time is reached, return a message to the user informing them that the maximum activation time has been reached. ' +
        'If the maximum activation time will be reached with the new activation, return a message to the user informing them that the maximum activation time will be reached with the new activation. ' +
        'Only call this tool after user confirms their choice from the presented options.',
    schema: RegisterVehicleActivationSchema,
    func: async (input: RegisterVehicleActivationInput) => {
        const result = await activationService.handleRegisterVehicleActivation(input);
        return result.text;
    }
});

export const activationTools = [
    checkVehicleCurrentActivationsTool,
    registerVehicleActivationTool
];
