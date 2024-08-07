import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ServerWipe } from './server-wipe.entity';
import { ShopItem } from '../../shop/entities/shop-item.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Commands } from '../../commands/entity/commands.entity';

@Entity()
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  name: string;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({ nullable: true })
  rustMapsId: string;

  @Column({ nullable: true })
  pass: string;

  @OneToMany(() => ServerWipe, (wipe) => wipe.server)
  wipes: ServerWipe[];

  @OneToMany(() => ShopItem, (item) => item.server)
  shopItem: ShopItem[];

  @OneToMany(() => Subscription, (item) => item.servers)
  subscriptions: ShopItem;

  @OneToMany(() => Commands, (item) => item.command)
  command: Commands[];
}
