export interface User {
    id: string;
    nome: string;
    documento: string;
}

export interface UserResponse {
    text: string;
}

export interface FindUserParams {
    document: string;
}

export interface BalanceParams {
    userId: number;
    prefectureId: string;
}

export interface DriverSearchResponse {
    metadados: {
        total: number;
    };
    resultado: User[];
}

export interface BalanceResponse {
    saldo: number;
}

// Service parameter types
export interface GetUserBalanceParams {
    userId: number;
}

// Service response types
export interface GetUserBalanceResponse {
    text: string;
}
