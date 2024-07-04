import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { ServerWipe } from './server-wipe.entity';
import { ShopItem } from '../../shop/entities/shop-item.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Commands } from 'src/domains/commands/entity/commands.entity';

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

  @Column()
  rustMapsId: string;

  @OneToMany(() => ServerWipe, (wipe) => wipe.server)
  wipes: ServerWipe[];

  @OneToMany(() => ShopItem, (item) => item.servers)
  shopItem: ShopItem;

  @OneToMany(() => Subscription, (item) => item.servers)
  subscriptions: ShopItem;

  @OneToMany(() => Commands, (command) => command.server)
  commands: Commands[];
}
