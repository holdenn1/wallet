import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./user.entity";
import {Banks} from "../types";

@Entity()
export class CreditCard {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: Banks })
    bankName: string

    @Column({ default: 0 })
    balance: number

    @ManyToOne(() => User, user => user.creditCard)
    user: User
}