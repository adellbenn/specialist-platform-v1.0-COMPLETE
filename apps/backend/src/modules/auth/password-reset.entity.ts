import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { User } from '@modules/users/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken extends AbstractEntity {
  @Column()
  @Index()
  token: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'datetime', nullable: true })
  usedAt: Date;

  @Column({ name: 'is_used', default: false })
  isUsed: boolean;
}
