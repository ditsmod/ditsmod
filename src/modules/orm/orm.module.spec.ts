import 'reflect-metadata';
import { StaticEntity, Entity } from './decorators/entity';
import { Column } from './decorators/column';
import { OrmModule } from './orm.module';
import { RootModule } from '../../decorators/root-module';
import { EntitiesToken } from '../../types/injection-tokens';
import { EntityInjector } from './services-per-app/entity-injector';

xdescribe('OrmModule', () => {
  class MockOrmModule extends OrmModule {}

  describe('default', () => {
    class SomeEntity {}

    @Entity()
    class MysqlEntity extends SomeEntity {}

    const entities = [{ provide: SomeEntity, useClass: MysqlEntity }];
    const modWithOptions = MockOrmModule.withOptions(entities);
    @RootModule({
      imports: [modWithOptions],
      exports: [modWithOptions]
    })
    class AppModule {}

    it(`should set default entity's metadata`, () => {
      expect((SomeEntity as typeof StaticEntity).entityMetadata).toBeUndefined();
      expect((SomeEntity as typeof StaticEntity).columnMetadata).toBeUndefined();
      expect((MysqlEntity as typeof StaticEntity).entityMetadata).toEqual(new Entity({}));
      expect((MysqlEntity as typeof StaticEntity).columnMetadata).toEqual(new Column({}));
      expect((MysqlEntity as typeof StaticEntity).metadata).toEqual({
        tableName: 'MysqlEntity',
        primaryColumns: [],
        databaseService: {}
      });
    });
  });

  describe('with some column settings', () => {
    class SomeEntity {
      fistName: string;
    }

    enum EnumType {
      one,
      two
    }

    @Entity({ tableName: 'users' })
    class MysqlEntity extends SomeEntity {
      @Column({ isPrimaryColumn: true })
      id: number; // Number

      @Column({ isPrimaryColumn: true })
      prop1: boolean; // Boolean
      @Column()
      prop2: string; // String
      @Column()
      prop3: string[]; // Array
      @Column()
      prop4: [string, number]; // Array
      @Column()
      prop5: []; // Array
      @Column()
      prop6: EnumType; // Number
      @Column()
      prop7: any; // Object
      @Column()
      prop8: void; // undefined
      @Column()
      prop9: never; // undefined
      @Column()
      // tslint:disable-next-line: ban-types
      prop10: Object; // Object
      @Column()
      prop11: object; // Object
      @Column()
      prop12: unknown; // Object
    }

    it(`should set default entity's metadata`, () => {
      const entities = [{ provide: SomeEntity, useClass: MysqlEntity }];

      @RootModule({
        providersPerApp: [EntityInjector, { provide: EntitiesToken, useValue: entities }]
      })
      class AppModule {}

      expect((SomeEntity as any).entityMetadata).toBeUndefined();
      expect((MysqlEntity as any).entityMetadata).toEqual(new Entity({ tableName: 'users' }));
    });
  });
});
