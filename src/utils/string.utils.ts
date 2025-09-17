export const formatCurrency = (value: number | string): string => {
    const parsedValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(parsedValue)) {
        throw new Error("Invalid value for currency formatting.");
    }

    return parsedValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    });
};

export const clearPlate = (plate: string): string => {
    return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

/**
 * Normaliza uma placa removendo pontuação e espaços
 * Alias para clearPlate para manter compatibilidade
 */
export const normalizePlate = (plate: string): string => {
    return clearPlate(plate);
};

/**
 * Normaliza texto para busca (remove acentos, pontuação e espaços extras)
 * Útil para buscas flexíveis em qualquer texto
 */
export const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD') // Decompõe caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
        .replace(/[^\w\s]/g, '') // Remove pontuação
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();
};

/**
 * Cria regex flexível para busca de texto
 * Permite erros de digitação e variações
 */
export const createFlexibleRegex = (searchTerm: string): RegExp => {
    const normalized = normalizeText(searchTerm);

    // Se for muito curto, busca exata
    if (normalized.length <= 2) {
        return new RegExp(`\\b${normalized}`, 'i');
    }

    // Para termos maiores, permite algumas variações
    const flexible = normalized
        .split(' ')
        .map(word => {
            if (word.length <= 3) {
                // Palavras curtas: busca exata no início
                return `\\b${word}`;
            } else {
                // Palavras longas: permite variações no final
                const prefix = word.substring(0, Math.floor(word.length * 0.7));
                return `\\b${prefix}\\w*`;
            }
        })
        .join('.*'); // Permite palavras intermediárias

    return new RegExp(flexible, 'i');
};

export const validateDocument = (document: string): string | null => {
    const parsed = document.replace(/\D/g, '');
    return parsed.length >= 11 ? parsed : null;
};
