import { readFileSync } from 'fs';
import { join } from 'path';
import { Controller, Response, Status } from '@ditsmod/core';

import { OasRoute } from './decorators/oas-route';

@Controller()
export class OpenapiController {
  constructor(private res: Response) {}

  @OasRoute('openapi', [], {
    get: {
      description: 'OpenAPI documentation',
      parameters: [],
      responses: {
        [Status.OK]: {
          description: 'Index file for the OpenAPI Specification',
          content: { ['text/html; charset=utf-8']: { schema: { $ref: '' } } },
        },
      },
    },
  })
  async getIndex() {
    const indexHtml = readFileSync(`${this.swaggerUi}/index.html`, 'utf8');
    this.res.setContentType('text/html; charset=utf-8').send(indexHtml);
  }

  @OasRoute('openapi.yaml', [], {
    get: {
      description: 'Config file in YAML format for the OpenAPI documentation',
      parameters: [],
      responses: {
        [Status.OK]: {
          description: 'YAML-file for the OpenAPI documentation',
          content: { ['text/yaml; charset=utf-8']: { schema: { $ref: '' } } },
        },
      },
    },
  })
  getYaml() {
    const openapiYaml = readFileSync(`${this.dist}/swagger-ui/openapi.yaml`, 'utf8');
    this.res.setContentType('text/yaml; charset=utf-8').send(openapiYaml);
  }

  @OasRoute('openapi.json', [], {
    get: {
      description: 'Config file in JSON format for the OpenAPI documentation',
      parameters: [],
      responses: {
        [Status.OK]: {
          description: 'JSON-file for the OpenAPI documentation',
          content: { ['application/json; charset=utf-8']: { schema: { $ref: '' } } },
        },
      },
    },
  })
  getJson() {
    const openapiJson = readFileSync(`${this.dist}/swagger-ui/openapi.json`, 'utf8');
    this.res.setContentType('application/json; charset=utf-8').send(openapiJson);
  }

  @OasRoute('openapi.bundle.js', [], {
    get: {
      description: 'SwaggerUI JavaScript bundle',
      parameters: [],
      responses: {
        [Status.OK]: {
          description: 'JavaScript-file with SwaggerUI logic',
          content: { ['text/javascript; charset=utf-8']: { schema: { $ref: '' } } },
        },
      },
    },
  })
  getJavaScript() {
    const appBundle = readFileSync(`${this.swaggerUi}/openapi.bundle.js`, 'utf8');
    this.res.setContentType('text/javascript; charset=utf-8').send(appBundle);
  }

  protected get swaggerUi() {
    return join(__dirname, '../dist-swagger-ui');
  }

  protected get dist() {
    return join(__dirname, '../dist');
  }
}
