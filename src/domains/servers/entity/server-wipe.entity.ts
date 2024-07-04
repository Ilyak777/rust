import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Server } from './server.entity';

export enum WipeType {
  FULL = 'full',
  PARTIAL = 'partial',
}

@Entity()
export class ServerWipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  wipeDate: Date;

  @Column({
    type: 'enum',
    enum: WipeType,
  })
  wipeType: WipeType;

  @ManyToOne(() => Server, (server) => server.wipes)
  server: Server;

  @Column()
  serverId: string;
}
