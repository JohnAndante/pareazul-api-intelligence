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

export const validateDocument = (document: string): string | null => {
    const parsed = document.replace(/\D/g, '');
    return parsed.length >= 11 ? parsed : null;
};
