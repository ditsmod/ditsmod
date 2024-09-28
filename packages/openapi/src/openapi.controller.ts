import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { controller, Status, Res } from '@ditsmod/core';

import { oasRoute } from './decorators/oas-route.js';
import { SwaggerConfigManager } from './services/swagger-config-manager.js';
import { OasConfigFiles } from './types/oas-extension-options.js';

@controller()
export class OpenapiController {
  constructor(
    private swaggerConfigManager: SwaggerConfigManager,
    private res: Res,
  ) {}

  @oasRoute('GET', 'openapi', {
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

  @oasRoute('GET', 'openapi.yaml', {
    description: 'Config file in YAML format for the OpenAPI documentation',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'YAML-file for the OpenAPI documentation',
        content: { ['text/yaml; charset=utf-8']: {} },
      },
    },
  })
  async getYaml(configFiles: OasConfigFiles) {
    this.res.setContentType('text/yaml; charset=utf-8').send(configFiles.yaml);
  }

  @oasRoute('GET', 'openapi.json', {
    description: 'Config file in JSON format for the OpenAPI documentation',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'JSON-file for the OpenAPI documentation',
        content: { ['application/json; charset=utf-8']: {} },
      },
    },
  })
  async getJson(configFiles: OasConfigFiles) {
    this.res.setContentType('application/json; charset=utf-8').send(configFiles.json);
  }

  @oasRoute('GET', 'openapi.bundle.js', {
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
    this.res.setContentType('text/javascript; charset=utf-8');
    createReadStream(`${this.swaggerConfigManager.webpackDist}/openapi.bundle.js`).pipe(this.res.nodeRes);
  }
}
