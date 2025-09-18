import { DynamicStructuredTool } from '@langchain/core/tools';
import { prefectureService } from '../services/prefecture.service';
import {
    GetPrefectureRulesSchema,
    GetPrefectureZoneRulesSchema,
    GetPrefectureRulesInput,
    GetPrefectureZoneRulesInput
} from '../schemas/prefecture.schema';

export const getPrefectureRulesTool = new DynamicStructuredTool({
    name: 'getPrefectureRules',
    description: 'Retrieves the rules of a prefecture by its ID and slug.',
    schema: GetPrefectureRulesSchema,
    func: async (input: GetPrefectureRulesInput) => {
        const result = await prefectureService.getPrefectureRules(input);
        return result.text;
    }
});

export const getPrefectureZonesTool = new DynamicStructuredTool({
    name: 'getPrefectureZones',
    description: 'Retrieves the zones of a prefecture by its ID and slug.',
    schema: GetPrefectureRulesSchema,
    func: async (input: GetPrefectureRulesInput) => {
        const result = await prefectureService.getPrefectureZones(input);
        return result.text;
    }
});

export const getPrefectureZoneRulesTool = new DynamicStructuredTool({
    name: 'getPrefectureZoneRules',
    description: 'Retrieves the rules of a zone by its ID and slug.',
    schema: GetPrefectureZoneRulesSchema,
    func: async (input: GetPrefectureZoneRulesInput) => {
        const result = await prefectureService.getPrefectureZoneRules(input);
        return result.text;
    }
});

export const prefectureTools = [
    getPrefectureRulesTool,
    getPrefectureZonesTool,
    getPrefectureZoneRulesTool
];
