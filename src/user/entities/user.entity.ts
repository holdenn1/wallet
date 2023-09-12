import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'app_user' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({nullable: true})
  photo: string;

  @Column({nullable:true})
  birthday: string;

  @Column({ unique: true })
  email: string;

  @Column({nullable:true})
  password: string;

  @Column({ default: 0 })
  cash: string;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
