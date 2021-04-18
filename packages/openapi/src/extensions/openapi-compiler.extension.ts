import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { edk, Logger, RootMetadata } from '@ditsmod/core';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';
import { XOasObject, XOperationObject, XParameterObject, XPathsObject } from '@ts-stack/openapi-spec';
import { stringify } from 'yaml';
import webpack from 'webpack';

import { webpackConfig } from '../swagger-ui/webpack.config';
import { OAS_OBJECT } from '../di-tokens';
import { OasRouteMeta } from '../types/oas-route-meta';
import { DEFAULT_OAS_OBJECT } from '../constants';

@Injectable()
export class OpenapiCompilerExtension implements edk.Extension<XOasObject> {
  #oasObject: XOasObject;

  constructor(
    private extensionManager: edk.ExtensionsManager,
    private injectorPerApp: ReflectiveInjector,
    private log: Logger,
    private rootMeta: RootMetadata
  ) {}

  async init() {
    if (this.#oasObject) {
      return this.#oasObject;
    }

    await this.compileOasObject();
    const dir = resolve(__dirname, '../../dist/swagger-ui');
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/openapi.json`, JSON.stringify(this.#oasObject));
    writeFileSync(`${dir}/openapi.yaml`, stringify(this.#oasObject));
    await this.applyServeUrl();

    return this.#oasObject;
  }

  protected applyServeUrl(url?: string) {
    const { port } = this.rootMeta.listenOptions;
    url = url || `http://localhost:${port}/openapi.yaml`;
    const futureFileContent = `export const url = '${url}';`;
    let ext = 'js';
    if(__dirname.split('/').slice(-2)[0] == 'src') {
      ext = 'ts';
    }
    const filePath = join(__dirname, `../swagger-ui/swagger.config.${ext}`);
    const currentFileContent = readFileSync(filePath, 'utf8');
    if (currentFileContent == futureFileContent) {
      this.log.debug(`Skipping override ${filePath}`);
      return;
    }
    const logMsg = `override ${filePath} from "${currentFileContent}" to "${futureFileContent}"`;
    this.log.debug(`Start ${logMsg}`);
    writeFileSync(filePath, futureFileContent, 'utf8');
    const compiler = webpack(webpackConfig);
    const promise = new Promise<void>((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) {
          reject(err);
        }

        const info = stats.toJson();

        if (stats.hasErrors()) {
          reject(info.errors[0]);
        }

        if (stats.hasWarnings()) {
          this.log.warn(info.warnings);
        }

        this.log.trace(
          stats.toString({
            chunks: false, // Makes the build much quieter
            colors: false, // Shows colors in the console
          })
        );
        // Log result...
        resolve();

        this.log.debug(`Finish ${logMsg}`);
      });
    }).catch(err => {
      // Rollback because webpack faild
      this.log.error(`Rollback during ${logMsg}`);
      writeFileSync(filePath, currentFileContent, 'utf8');
      throw err;
    });

    return promise;
  }

  protected async compileOasObject() {
    const paths: XPathsObject = {};

    const rawRouteMeta = await this.extensionManager.init(edk.ROUTES_EXTENSIONS);
    rawRouteMeta.forEach((rawMeta) => {
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(rawMeta.providersPerMod);
      const injectorPerRou = injectorPerMod.resolveAndCreateChild(rawMeta.providersPerRou);
      const oasRouteMeta = injectorPerRou.get(OasRouteMeta) as OasRouteMeta;
      if (oasRouteMeta.pathItem) {
        paths[`/${oasRouteMeta.oasPath}`] = oasRouteMeta.pathItem;
      } else {
        if (!oasRouteMeta.httpMethod) {
          throw new Error('OpenapiCompilerExtension: OasRouteMeta not found.');
        }
        this.applyNonOasRoute(paths, oasRouteMeta);
      }
    });

    this.#oasObject = Object.assign({}, DEFAULT_OAS_OBJECT, this.injectorPerApp.get(OAS_OBJECT));
    this.#oasObject.paths = paths;

    return this.#oasObject;
  }

  protected applyNonOasRoute(paths: XPathsObject, routeMeta: edk.RouteMeta) {
    const httpMethod = routeMeta.httpMethod.toLowerCase();
    const parameters: XParameterObject[] = [];
    let path = routeMeta.path;
    path = `/${path}`.replace(/:([^\/]+)/g, (_, name) => {
      parameters.push({ in: 'path', name, required: true });
      return `{${name}}`;
    });
    const operationObject: XOperationObject = { parameters, responses: {} };
    if (routeMeta.parseBody) {
      operationObject.requestBody = {
        description: 'It is default content field for non-OasRoute',
        content: { ['application/json']: { schema: { $ref: '' } } },
      };
    }
    if (paths[path]) {
      paths[path][httpMethod] = operationObject;
    } else {
      paths[path] = { [httpMethod]: operationObject };
    }
  }
}
