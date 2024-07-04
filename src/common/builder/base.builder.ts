import { BaseEntity } from '../entity/entity-base';

export abstract class BaseEntityBuilder<T extends BaseEntity> {
  protected entity: T;

  public build(): T {
    return this.entity;
  }
}
