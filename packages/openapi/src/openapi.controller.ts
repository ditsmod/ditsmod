import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Controller, Logger, Request, Response, Route } from '@ditsmod/core';
import webpack from 'webpack';

import { config } from './swagger-ui/webpack.config';

@Controller()
export class OpenapiController {
  constructor(private req: Request, private res: Response, private log: Logger) {}

  @Route('GET', 'openapi')
  async getIndex() {
    if (this.req.queryParams?.refresh) {
      await this.refreshOasDocs();
    }
    const indexHtml = readFileSync(`${this.swaggerUi}/index.html`, 'utf8');
    this.res.setContentType('text/html; charset=utf-8').send(indexHtml);
  }

  @Route('GET', 'openapi.yaml')
  getYaml() {
    const openapiYaml = readFileSync(`${this.dist}/swagger-ui/openapi.yaml`, 'utf8');
    this.res.setContentType('text/yaml; charset=utf-8').send(openapiYaml);
  }

  @Route('GET', 'openapi.json')
  getJson() {
    const openapiJson = readFileSync(`${this.dist}/swagger-ui/openapi.json`, 'utf8');
    this.res.setContentType('application/json; charset=utf-8').send(openapiJson);
  }

  @Route('GET', 'app.bundle.js')
  getJavaScript() {
    const appBundle = readFileSync(`${this.swaggerUi}/app.bundle.js`, 'utf8');
    this.res.setContentType('text/javascript; charset=utf-8').send(appBundle);
  }

  protected refreshOasDocs() {
    const compiler = webpack(config);
    return new Promise<void>((resolve, reject) => {
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

        this.log.debug(
          stats.toString({
            chunks: false, // Makes the build much quieter
            colors: false, // Shows colors in the console
          })
        );
        // Log result...
        resolve();
      });
    });
  }

  protected get swaggerUi() {
    return resolve(__dirname, '../dist-swagger-ui');
  }

  protected get dist() {
    return resolve(__dirname, '../dist');
  }
}
