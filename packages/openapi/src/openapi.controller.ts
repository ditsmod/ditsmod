import { readFileSync } from 'fs';
import { Controller, Response, Status } from '@ditsmod/core';

import { OasRoute } from './decorators/oas-route';
import { SwaggerConfigManager } from './services/swagger-config-manager';

@Controller()
export class OpenapiController {
  constructor(private res: Response, private swaggerConfigManager: SwaggerConfigManager) {}

  @OasRoute('openapi', [], {
    get: {
      description: 'OpenAPI documentation',
      parameters: [],
      responses: {
        [Status.OK]: {
          description: 'Index file for the OpenAPI Specification',
          content: { ['text/html; charset=utf-8']: {} },
        },
      },
    },
  })
  async getIndex() {
    await this.swaggerConfigManager.applyConfig();
    const indexHtml = readFileSync(`${this.swaggerConfigManager.webpackDist}/index.html`, 'utf8');
    this.res.setContentType('text/html; charset=utf-8').send(indexHtml);
  }

  @OasRoute('openapi.yaml', [], {
    get: {
      description: 'Config file in YAML format for the OpenAPI documentation',
      parameters: [],
      responses: {
        [Status.OK]: {
          description: 'YAML-file for the OpenAPI documentation',
          content: { ['text/yaml; charset=utf-8']: {} },
        },
      },
    },
  })
  getYaml() {
    const openapiYaml = readFileSync(`${this.swaggerConfigManager.swaggerDist}/openapi.yaml`, 'utf8');
    this.res.setContentType('text/yaml; charset=utf-8').send(openapiYaml);
  }

  @OasRoute('openapi.json', [], {
    get: {
      description: 'Config file in JSON format for the OpenAPI documentation',
      parameters: [],
      responses: {
        [Status.OK]: {
          description: 'JSON-file for the OpenAPI documentation',
          content: { ['application/json; charset=utf-8']: {} },
        },
      },
    },
  })
  getJson() {
    const openapiJson = readFileSync(`${this.swaggerConfigManager.swaggerDist}/openapi.json`, 'utf8');
    this.res.setContentType('application/json; charset=utf-8').send(openapiJson);
  }

  @OasRoute('openapi.bundle.js', [], {
    get: {
      description: 'SwaggerUI JavaScript bundle',
      parameters: [],
      responses: {
        [Status.OK]: {
          description: 'JavaScript-file with SwaggerUI logic',
          content: { ['text/javascript; charset=utf-8']: {} },
        },
      },
    },
  })
  getJavaScript() {
    const appBundle = readFileSync(`${this.swaggerConfigManager.webpackDist}/openapi.bundle.js`, 'utf8');
    this.res.setContentType('text/javascript; charset=utf-8').send(appBundle);
  }
}
