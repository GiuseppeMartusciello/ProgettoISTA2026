import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

@Entity()
@Unique(['challengeId'])
export class AuthChallenge extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    challengeId: string;

    @Column()
    userId: string;

    @Column()
    type: string; // "LOGIN_2FA"

    @Column()
    expiresAt: Date;

    @Column({ default: 0 })
    attempts: number;

    @Column({ default: 5 })
    maxAttempts: number;

    @CreateDateColumn()
    createdAt: Date;
}
