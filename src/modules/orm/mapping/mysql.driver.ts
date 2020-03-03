import { Injectable, Type } from '@ts-stack/di';

import { EntityModel } from '../decorators/entity';
import { MysqlService } from './mysql.service';
import { isColumn } from '../../../utils/type-guards';
import { MysqlTableOptions } from './mysql-decorators';
import { Driver, Translated, MysqlColumnsMetadata, MysqlMetadata } from '../mapping/types';
import { MetadataProvider } from '../services-per-app/metadata-provider';

@Injectable()
export class MysqlDriver implements Driver {
  constructor(protected metadataProvider: MetadataProvider, protected mysqlService: MysqlService) {}

  loadMapping(modelMedatadaMap: Map<EntityModel, Type<any>>) {
    const map = new Map<EntityModel, Translated>();
    const metadataMap = this.metadataProvider.getMetadataMap(modelMedatadaMap);

    metadataMap.forEach((modelMetadata, Token) => {
      const { tableName } = modelMetadata.entityMetadata as MysqlTableOptions;
      const columnMetadata = modelMetadata.columnMetadata as MysqlColumnsMetadata;
      const primaryColumns: string[] = [];
      for (const columnName in columnMetadata) {
        const columnDef = columnMetadata[columnName].filter(isColumn);
        for (const def of columnDef) {
          if (def.isPrimaryColumn) {
            primaryColumns.push(columnName);
          }
        }
      }
      const metadata: MysqlMetadata = { tableName, primaryColumns };
      const insert: [string, any] = ['', ''];
      const find: [string] = [`select * from ${metadata.tableName};`];

      const whereStatement = metadata.primaryColumns.map(k => `${k} = ?`).join(' and ');
      const findAll: [string, any] = [`select * from ${metadata.tableName} where ${whereStatement};`, ''];

      const update: [string, any] = ['', ''];
      const deletes: [string, any] = ['', ''];
      const translated: Translated = { db: this.mysqlService, insert, findAll, find, update, delete: deletes };
      map.set(Token, translated);
    });

    return map;
  }
}
