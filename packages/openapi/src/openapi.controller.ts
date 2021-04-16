import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Controller, Response, Route } from '@ditsmod/core';

@Controller()
export class OpenapiController {
  constructor(private res: Response){}

  @Route('GET', 'openapi')
  getIndex() {
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

  protected get swaggerUi() {
    return resolve(__dirname, '../dist-swagger-ui');
  }

  protected get dist() {
    return resolve(__dirname, '../dist');
  }
}