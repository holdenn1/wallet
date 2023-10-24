import { User } from "../entities/user.entity";

export enum Banks {
    MONOBANK  = 'monobank',
    PRIVAT_BANK  = 'privat-bank',
    OSCHADBANK = 'oschadbank'
}

export type UserToProfile = Omit<User, 'refreshTokens' | 'transactions'| 'createAt' | 'updateAt' | 'password'>;
