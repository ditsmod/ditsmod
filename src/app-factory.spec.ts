import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ReflectiveInjector } from 'ts-di';

import { AppFactory } from './app-factory';
import { ModuleType, Logger, Server } from './types/types';
import { RootModuleDecorator, RootModule, ApplicationMetadata } from './decorators/root-module';
import { PreRequest } from './services/pre-request';
import { defaultProvidersPerApp } from './types/default-providers';
import { Entity, StaticEntity } from './decorators/entity';
import { Column } from './decorators/column';
import { Router } from './types/router';

describe('AppFactory', () => {
  class MockAppFactory extends AppFactory {
    log: Logger;
    server: Server;
    injectorPerApp: ReflectiveInjector;
    router: Router;
    preReq: PreRequest;
    opts = new ApplicationMetadata();

    mergeMetadata(appModule: ModuleType): void {
      return super.mergeMetadata(appModule);
    }

    getAppModuleMetadata(appModule: ModuleType): RootModuleDecorator {
      return super.getAppModuleMetadata(appModule);
    }

    checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
    }

    setEntityMetadata() {
      return super.setEntityMetadata();
    }
  }

  let mock: MockAppFactory;
  class SomeControllerClass {}
  class ClassWithoutDecorators {}

  beforeEach(() => {
    mock = new MockAppFactory();
  });

  describe('mergeMetadata()', () => {
    it('should set default metatada', () => {
      @RootModule()
      class ClassWithDecorators {}

      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toBe('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.routesPrefixPerApp).toBe('');
      expect(mock.opts.routesPrefixPerMod).toEqual([]);
      expect(mock.opts.entities).toEqual([]);
      expect(mock.opts.providersPerApp).toEqual(defaultProvidersPerApp);
      expect(mock.opts.listenOptions).toBeDefined();
      // Ignore controllers - it's intended behavior.
      expect((mock.opts as any).routesPerMod).toBe(undefined);
      expect((mock.opts as any).controllers).toBe(undefined);
      expect((mock.opts as any).exports).toBe(undefined);
      expect((mock.opts as any).imports).toBe(undefined);
      expect((mock.opts as any).providersPerMod).toBe(undefined);
      expect((mock.opts as any).providersPerReq).toBe(undefined);
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      class SomeModule {}
      class OtherModule {}
      class SomeEntity {}

      const routesPrefixPerMod = [
        { prefix: '', module: SomeModule },
        { prefix: '', module: OtherModule }
      ];

      @RootModule({
        routesPrefixPerApp: 'api',
        routesPrefixPerMod,
        controllers: [SomeControllerClass],
        providersPerApp: [ClassWithoutDecorators],
        entities: [SomeEntity]
      })
      class ClassWithDecorators {}

      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.routesPrefixPerApp).toBe('api');
      expect(mock.opts.routesPrefixPerMod).toEqual(routesPrefixPerMod);
      expect(mock.opts.entities).toEqual([SomeEntity]);
      expect(mock.opts.providersPerApp).toEqual([...defaultProvidersPerApp, ClassWithoutDecorators]);
      expect(mock.opts.listenOptions).toBeDefined();
      // Ignore controllers - it's intended behavior.
      expect((mock.opts as any).routesPerMod).toBe(undefined);
      expect((mock.opts as any).controllers).toBe(undefined);
      expect((mock.opts as any).exports).toBe(undefined);
      expect((mock.opts as any).imports).toBe(undefined);
      expect((mock.opts as any).providersPerMod).toBe(undefined);
      expect((mock.opts as any).providersPerReq).toBe(undefined);
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@RootModule()" decorator`;
      expect(() => mock.mergeMetadata(ClassWithoutDecorators)).toThrowError(msg);
    });
  });

  describe('getAppModuleMetadata()', () => {
    it('should returns ClassWithDecorators metadata', () => {
      @RootModule({ controllers: [SomeControllerClass] })
      class ClassWithDecorators {}
      const metadata = mock.getAppModuleMetadata(ClassWithDecorators);
      expect(metadata).toEqual(new RootModule({ controllers: [SomeControllerClass] }));
    });

    it('should not returns any metadata', () => {
      const metadata = mock.getAppModuleMetadata(ClassWithoutDecorators);
      expect(metadata).toBeUndefined();
    });
  });

  describe('setEntityMetadata()', () => {
    describe('default', () => {
      class SomeEntity {}

      @Entity()
      class MysqlEntity extends SomeEntity {}

      it(`should set default entity's metadata`, () => {
        mock.opts.entities = [SomeEntity, { provide: SomeEntity, useClass: MysqlEntity }];
        mock.setEntityMetadata();
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
        mock.opts.entities = [SomeEntity, { provide: SomeEntity, useClass: MysqlEntity }];
        mock.setEntityMetadata();
        expect((SomeEntity as any).entityMetadata).toBeUndefined();
        expect((MysqlEntity as any).entityMetadata).toEqual(new Entity({ tableName: 'users' }));
      });
    });
  });

  describe('checkSecureServerOption()', () => {
    @RootModule({
      controllers: [SomeControllerClass],
      providersPerApp: [ClassWithoutDecorators]
    })
    class ClassWithDecorators {}

    it('should not to throw with http2 and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = http2;
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).toThrowError(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.opts.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).not.toThrowError(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = https;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).toThrowError(msg);
    });
  });
});
