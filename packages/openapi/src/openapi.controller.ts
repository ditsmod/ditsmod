import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { Status, Res } from '@ditsmod/core';
import { controller } from '@ditsmod/routing';

import { webpackDist } from './swagger-ui/constants.js';
import { oasRoute } from './decorators/oas-route.js';
import { OasConfigFiles } from './types/oas-extension-options.js';

@controller()
export class OpenapiController {
  constructor(private res: Res) {}

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
    const indexHtml = await readFile(`${webpackDist}/index.html`, 'utf8');
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
  getJavaScript() {
    this.res.setContentType('text/javascript; charset=utf-8');
    return new Promise((resolve, reject) => {
      createReadStream(`${webpackDist}/openapi.bundle.js`)
        .on('close', resolve)
        .on('error', reject)
        .pipe(this.res.rawRes);
    });
  }
}
