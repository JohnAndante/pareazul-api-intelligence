import { activationService } from '../../../services/activation.service';

// Mock das dependências externas
jest.mock('../../../services/memory.service', () => ({
    memoryService: {
        getSessionCache: jest.fn(),
    },
}));

jest.mock('../../../api/activation.api', () => ({
    activateVehicle: jest.fn(),
    fetchVehicleCurrentActivations: jest.fn(),
}));

jest.mock('../../../api/vehicle.api', () => ({
    fetchUserVehicles: jest.fn(),
}));

jest.mock('../../../api/prefecture.api', () => ({
    fetchPrefectureRules: jest.fn(),
}));

jest.mock('../../../utils/string.util', () => ({
    StringUtil: {
        clearPlate: jest.fn((plate) => plate),
    },
}));

jest.mock('../../../utils/logger.util', () => ({
    logger: {
        child: jest.fn().mockReturnValue({
            error: jest.fn(),
            info: jest.fn(),
        }),
    },
}));

describe('ActivationService', () => {
    let mockMemoryService: any;
    let mockActivateVehicle: any;
    let mockFetchVehicleCurrentActivations: any;
    let mockFetchUserVehicles: any;
    let mockFetchPrefectureRules: any;
    let mockStringUtil: any;

    beforeEach(() => {
        // Importar os mocks após a criação da instância
        const { memoryService } = require('../../../services/memory.service');
        const { activateVehicle, fetchVehicleCurrentActivations } = require('../../../api/activation.api');
        const { fetchUserVehicles } = require('../../../api/vehicle.api');
        const { fetchPrefectureRules } = require('../../../api/prefecture.api');
        const { StringUtil } = require('../../../utils/string.util');

        mockMemoryService = memoryService;
        mockActivateVehicle = activateVehicle;
        mockFetchVehicleCurrentActivations = fetchVehicleCurrentActivations;
        mockFetchUserVehicles = fetchUserVehicles;
        mockFetchPrefectureRules = fetchPrefectureRules;
        mockStringUtil = StringUtil;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('checkCurrentVehicleActivation', () => {
        it('should return activation details when vehicle is activated', async () => {
            // Arrange
            const params = {
                userId: 'user123',
                vehiclePlate: 'ABC1234',
            };

            const mockUserPayload = {
                assistant_id: 'assistant123',
                assistant_chat_id: 'chat123',
                payload: {
                    prefeitura_id: '1',
                    prefeitura_sigla: 'SP',
                    prefeitura_nome: 'São Paulo',
                    prefeitura_timezone: 'America/Sao_Paulo',
                    usuario_id: 'user123',
                    usuario_nome: 'Test User',
                    usuario_email: 'test@example.com',
                    usuario_cpf: '12345678901',
                },
                prefecture_user_token: 'token123',
                user_token: 'user-token123',
            };

            const mockActivations = [
                {
                    currently_active: true,
                    remaining_time: 30,
                    start_date: '2024-01-01T10:00:00Z',
                    end_date: '2024-01-01T12:00:00Z',
                    value: 2.0,
                    activation_time: 120,
                    is_extended: false,
                    total_duration_minutes: 120,
                },
            ];

            mockMemoryService.getSessionCache.mockResolvedValue(mockUserPayload);
            mockStringUtil.clearPlate.mockReturnValue('ABC1234');
            mockFetchVehicleCurrentActivations.mockResolvedValue(mockActivations);

            // Act
            const result = await activationService.checkCurrentVehicleActivation(params);

            // Assert
            expect(result.text).toContain('Vehicle plate ABC1234 is currently activated');
            expect(result.text).toContain('30 minutes');
            expect(result.text).toContain('2024-01-01T12:00:00Z');
            expect(mockMemoryService.getSessionCache).toHaveBeenCalledWith('user123');
            expect(mockFetchVehicleCurrentActivations).toHaveBeenCalledWith(
                'ABC1234',
                '1',
                'America/Sao_Paulo',
                'token123'
            );
        });

        it('should return no activation message when vehicle is not activated', async () => {
            // Arrange
            const params = {
                userId: 'user123',
                vehiclePlate: 'ABC1234',
            };

            const mockUserPayload = {
                assistant_id: 'assistant123',
                assistant_chat_id: 'chat123',
                payload: {
                    prefeitura_id: '1',
                    prefeitura_sigla: 'SP',
                    prefeitura_nome: 'São Paulo',
                    prefeitura_timezone: 'America/Sao_Paulo',
                    usuario_id: 'user123',
                    usuario_nome: 'Test User',
                    usuario_email: 'test@example.com',
                    usuario_cpf: '12345678901',
                },
                prefecture_user_token: 'token123',
                user_token: 'user-token123',
            };

            mockMemoryService.getSessionCache.mockResolvedValue(mockUserPayload);
            mockStringUtil.clearPlate.mockReturnValue('ABC1234');
            mockFetchVehicleCurrentActivations.mockResolvedValue([]);

            // Act
            const result = await activationService.checkCurrentVehicleActivation(params);

            // Assert
            expect(result.text).toBe('No activation found for vehicle plate ABC1234.');
        });

        it('should return error when user session not found', async () => {
            // Arrange
            const params = {
                userId: 'user123',
                vehiclePlate: 'ABC1234',
            };

            mockMemoryService.getSessionCache.mockResolvedValue(null);

            // Act
            const result = await activationService.checkCurrentVehicleActivation(params);

            // Assert
            expect(result.text).toBe('User session not found. Wrong userId provided or user session expired.');
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            const params = {
                userId: 'user123',
                vehiclePlate: 'ABC1234',
            };

            mockMemoryService.getSessionCache.mockRejectedValue(new Error('Memory service error'));

            // Act
            const result = await activationService.checkCurrentVehicleActivation(params);

            // Assert
            expect(result.text).toBe('Error getting user payload.');
        });
    });

    describe('handleRegisterVehicleActivation', () => {
        it('should register vehicle activation successfully', async () => {
            // Arrange
            const params = {
                userId: 'user123',
                vehiclePlate: 'ABC1234',
                timeValueRuleId: 1,
                extend: false,
            };

            const mockUserPayload = {
                assistant_id: 'assistant123',
                assistant_chat_id: 'chat123',
                payload: {
                    prefeitura_id: '1',
                    prefeitura_sigla: 'SP',
                    prefeitura_nome: 'São Paulo',
                    prefeitura_timezone: 'America/Sao_Paulo',
                    usuario_id: 'user123',
                    usuario_nome: 'Test User',
                    usuario_email: 'test@example.com',
                    usuario_cpf: '12345678901',
                },
                prefecture_user_token: 'token123',
                user_token: 'user-token123',
            };

            const mockUserVehicles = [
                {
                    plate: 'ABC1234',
                    model: 'Test Car',
                    vehicle_type_id: 1,
                },
            ];

            const mockRules = [
                {
                    id: 1,
                    nome: 'Test Rule',
                    tempo_maximo: 120,
                    horario_funcionamentos: [],
                    tipo_veiculos: [],
                    regra_valor_tempos: [
                        {
                            id: 1,
                            tempo: 120,
                            valor: 2.0,
                            tipo_veiculo_id: 1,
                            permitir_ativar: true,
                        },
                    ],
                },
            ];

            const mockActivation = {
                id: 1,
                codigo: 'ACT123',
                veiculo_usuario_placa: 'ABC1234',
                data_criacao: '2024-01-01T10:00:00Z',
                data_inicio_ativacao: '2024-01-01T10:00:00Z',
                data_final_ativacao: '2024-01-01T12:00:00Z',
                motivo_atualizacao: 'Ativação',
                informacao_adicional: '',
                endereco_logradouro: 'Test Street',
                endereco_numero: '123',
                endereco_bairro: 'Test District',
                estado: 'Active',
                latitude: -23.5505,
                longitude: -46.6333,
                ativacao_anterior_id: 0,
                prefeitura_id: 1,
                regra_valor_tempo_id: 1,
                vendedor_id: 1,
                conta_usuario_id: 1,
                tipo_veiculo_id: 1,
                uuid_ativacao: 'uuid123',
                imei_dispositivo: 'imei123',
                uuid_dispositivo: 'device123',
                numero_vaga: 'V001',
                origem: 'APP',
                valor: 2.0,
                tempo: 120,
            };

            mockMemoryService.getSessionCache.mockResolvedValue(mockUserPayload);
            mockFetchUserVehicles.mockResolvedValue(mockUserVehicles);
            mockStringUtil.clearPlate.mockReturnValue('ABC1234');
            mockFetchVehicleCurrentActivations.mockResolvedValue([]);
            mockFetchPrefectureRules.mockResolvedValue(mockRules);
            mockActivateVehicle.mockResolvedValue(mockActivation);

            // Act
            const result = await activationService.handleRegisterVehicleActivation(params);

            // Assert
            expect(result.text).toContain('Vehicle with plate ABC1234 has been successfully activated');
            expect(mockActivateVehicle).toHaveBeenCalledWith({
                vehiclePlate: 'ABC1234',
                prefectureId: '1',
                timeValueRuleId: 1,
                vehicleTypeId: 1,
                userId: 'user123',
                userToken: 'token123',
                extend: false,
                previousActivationId: undefined,
            });
        });

        it('should return error when vehicle not registered for user', async () => {
            // Arrange
            const params = {
                userId: 'user123',
                vehiclePlate: 'ABC1234',
                timeValueRuleId: 1,
                extend: false,
            };

            const mockUserPayload = {
                assistant_id: 'assistant123',
                assistant_chat_id: 'chat123',
                payload: {
                    prefeitura_id: '1',
                    prefeitura_sigla: 'SP',
                    prefeitura_nome: 'São Paulo',
                    prefeitura_timezone: 'America/Sao_Paulo',
                    usuario_id: 'user123',
                    usuario_nome: 'Test User',
                    usuario_email: 'test@example.com',
                    usuario_cpf: '12345678901',
                },
                prefecture_user_token: 'token123',
                user_token: 'user-token123',
            };

            mockMemoryService.getSessionCache.mockResolvedValue(mockUserPayload);
            mockFetchUserVehicles.mockResolvedValue([]);
            mockStringUtil.clearPlate.mockReturnValue('ABC1234');

            // Act
            const result = await activationService.handleRegisterVehicleActivation(params);

            // Assert
            expect(result.text).toBe('Vehicle plate ABC1234 not registered for user user123.');
        });

        it('should return error when user session not found', async () => {
            // Arrange
            const params = {
                userId: 'user123',
                vehiclePlate: 'ABC1234',
                timeValueRuleId: 1,
                extend: false,
            };

            mockMemoryService.getSessionCache.mockResolvedValue(null);

            // Act
            const result = await activationService.handleRegisterVehicleActivation(params);

            // Assert
            expect(result.text).toBe('User session not found. Wrong userId provided or user session expired.');
        });

        it('should handle API errors with specific error codes', async () => {
            // Arrange
            const params = {
                userId: 'user123',
                vehiclePlate: 'ABC1234',
                timeValueRuleId: 1,
                extend: false,
            };

            const mockUserPayload = {
                assistant_id: 'assistant123',
                assistant_chat_id: 'chat123',
                payload: {
                    prefeitura_id: '1',
                    prefeitura_sigla: 'SP',
                    prefeitura_nome: 'São Paulo',
                    prefeitura_timezone: 'America/Sao_Paulo',
                    usuario_id: 'user123',
                    usuario_nome: 'Test User',
                    usuario_email: 'test@example.com',
                    usuario_cpf: '12345678901',
                },
                prefecture_user_token: 'token123',
                user_token: 'user-token123',
            };

            const mockUserVehicles = [
                {
                    plate: 'ABC1234',
                    model: 'Test Car',
                    vehicle_type_id: 1,
                },
            ];

            const mockRules = [
                {
                    id: 1,
                    nome: 'Test Rule',
                    tempo_maximo: 120,
                    horario_funcionamentos: [],
                    tipo_veiculos: [],
                    regra_valor_tempos: [
                        {
                            id: 1,
                            tempo: 120,
                            valor: 2.0,
                            tipo_veiculo_id: 1,
                            permitir_ativar: true,
                        },
                    ],
                },
            ];

            const mockError = {
                response: {
                    data: {
                        code: 606,
                        message: 'Maximum active plates reached',
                    },
                },
            };

            mockMemoryService.getSessionCache.mockResolvedValue(mockUserPayload);
            mockFetchUserVehicles.mockResolvedValue(mockUserVehicles);
            mockStringUtil.clearPlate.mockReturnValue('ABC1234');
            mockFetchVehicleCurrentActivations.mockResolvedValue([]);
            mockFetchPrefectureRules.mockResolvedValue(mockRules);
            mockActivateVehicle.mockRejectedValue(mockError);

            // Act
            const result = await activationService.handleRegisterVehicleActivation(params);

            // Assert
            expect(result.text).toContain('❌ ACTIVATION BLOCKED: Maximum number of active plates reached');
        });
    });
});
