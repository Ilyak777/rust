import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ProfileSocials {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  vk: string;

  @Column({ nullable: true })
  youtube: string;

  @Column({ nullable: true })
  steam: string;
}
