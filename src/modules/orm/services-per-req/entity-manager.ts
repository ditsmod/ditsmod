import { Injectable, Injector } from '@ts-stack/di';

import { Request } from '../../../request';
import { EntityModel } from '../decorators/entity';
import { MetadataProvider } from '../services-per-app/metadata-provider';

@Injectable()
export class EntityManager {
  constructor(protected req: Request, protected injector: Injector, protected entityInjector: MetadataProvider) {}

  find<T extends EntityModel>(Entity: T): Promise<T['prototype'][]> {
    const metadata = this.getMetadata(Entity);
    const sql = `select * from ${metadata.tableName};`;
    return this.query(metadata, sql);
  }

  findAndCount<T extends EntityModel>(Entity: T): Promise<T['prototype'][]> {
    const metadata = this.getMetadata(Entity);
    const sql = `select * from ${metadata.tableName};`;
    return this.query(metadata, sql);
  }

  findOne<T extends EntityModel>(Entity: T, params?: any): Promise<T['prototype'][]> {
    const metadata = this.getMetadata(Entity);
    const whereStatement = metadata.primaryColumns.map((k: any) => `${k} = ?`).join(' and ');
    const sql = `select * from ${metadata.tableName} where ${whereStatement};`;
    params = params || this.req.routeParamsArr.map(item => item.value);
    return this.query(metadata, sql, params);
  }

  flush() {}

  protected query(metadata: any, sql: string, params?: string[]) {
    const dbService = this.injector.get(metadata.dbService);
    return dbService.query(sql, params);
  }

  protected getMetadata(Entity: EntityModel): any {}
}
