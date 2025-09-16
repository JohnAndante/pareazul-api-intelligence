import { DynamicStructuredTool } from '@langchain/core/tools';
import { vehicleService } from '../services/vehicle.service';
import {
    GetUserVehiclesInput,
    RegisterUserVehicleInput,
    GetUserVehiclesValidator,
    RegisterUserVehicleValidator
} from '../validators/vehicle.validator';
import { vehicleTypes } from '../utils/vehicle.utils';

export const getUserVehiclesTool = new DynamicStructuredTool({
    name: 'getUserVehicles',
    description: 'Retrieves the vehicles of a user by their session. ' +
        'Can be filtered by plate or model. ' +
        'The plate must be a valid plate number, like \'ABC1234\', \'ABC1D23\', etc. (The plate can be partial, like \'ABC123\', \'ABC1D2\', etc.) ' +
        'The model must be a valid model, like \'Gol\', \'Fusca\', etc. ' +
        'If no plate or model is provided, all vehicles of the user will be returned.',
    schema: GetUserVehiclesValidator,
    func: async (input: GetUserVehiclesInput) => {
        const result = await vehicleService.getUserVehicles(input);
        return result.text;
    }
});

export const registerUserVehicleTool = new DynamicStructuredTool({
    name: 'registerUserVehicle',
    description: 'Registers a vehicle for a user. ' +
        'The vehicle must include its plate, model, and type. ' +
        'For the type, you can retrieve the available vehicle types ' +
        'using the \'getVehicleTypes\' tool, but currently the accepted types are: ' +
        Object.values(vehicleTypes).map(type => `- ${type}`).join('\n'),
    schema: RegisterUserVehicleValidator,
    func: async (input: RegisterUserVehicleInput) => {
        const result = await vehicleService.registerUserVehicle(input);
        return result.text;
    }
});

export const getVehicleTypesTool = new DynamicStructuredTool({
    name: 'getVehicleTypes',
    description: 'Retrieves the available vehicle types.',
    schema: {}, // Sem parâmetros
    func: async () => {
        const vehicleTypesList = Object.entries(vehicleTypes)
            .map(([id, name]) => `${id}: ${name}`)
            .join('\n');
        return `Available vehicle types:\n${vehicleTypesList}`;
    }
});

export const vehicleTools = [
    getUserVehiclesTool,
    registerUserVehicleTool,
    getVehicleTypesTool
];
