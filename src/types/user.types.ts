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
    userId: string;
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
