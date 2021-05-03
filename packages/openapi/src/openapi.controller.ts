import { readFile } from 'fs/promises';
import { Controller, Response, Status } from '@ditsmod/core';

import { OasRoute } from './decorators/oas-route';
import { SwaggerConfigManager } from './services/swagger-config-manager';

@Controller()
export class OpenapiController {
  constructor(private res: Response, private swaggerConfigManager: SwaggerConfigManager) {}

  @OasRoute('GET', 'openapi', [], {
    tags: ['OasDocs'],
    description: 'OpenAPI documentation',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'Index file for the OpenAPI Specification',
        content: { ['text/html; charset=utf-8']: {} },
      },
    },
  })
  async getIndex() {
    await this.swaggerConfigManager.applyConfig();
    const indexHtml = await readFile(`${this.swaggerConfigManager.webpackDist}/index.html`, 'utf8');
    this.res.setContentType('text/html; charset=utf-8').send(indexHtml);
  }

  @OasRoute('GET', 'openapi.yaml', [], {
    tags: ['OasDocs'],
    description: 'Config file in YAML format for the OpenAPI documentation',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'YAML-file for the OpenAPI documentation',
        content: { ['text/yaml; charset=utf-8']: {} },
      },
    },
  })
  async getYaml() {
    const openapiYaml = await readFile(`${this.swaggerConfigManager.swaggerDist}/openapi.yaml`, 'utf8');
    this.res.setContentType('text/yaml; charset=utf-8').send(openapiYaml);
  }

  @OasRoute('GET', 'openapi.json', [], {
    tags: ['OasDocs'],
    description: 'Config file in JSON format for the OpenAPI documentation',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'JSON-file for the OpenAPI documentation',
        content: { ['application/json; charset=utf-8']: {} },
      },
    },
  })
  async getJson() {
    const openapiJson = await readFile(`${this.swaggerConfigManager.swaggerDist}/openapi.json`, 'utf8');
    this.res.setContentType('application/json; charset=utf-8').send(openapiJson);
  }

  @OasRoute('GET', 'openapi.bundle.js', [], {
    tags: ['OasDocs'],
    description: 'SwaggerUI JavaScript bundle',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'JavaScript-file with SwaggerUI logic',
        content: { ['text/javascript; charset=utf-8']: {} },
      },
    },
  })
  async getJavaScript() {
    const appBundle = await readFile(`${this.swaggerConfigManager.webpackDist}/openapi.bundle.js`, 'utf8');
    this.res.setContentType('text/javascript; charset=utf-8').send(appBundle);
  }
}
