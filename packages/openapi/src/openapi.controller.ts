import { readFile } from 'fs/promises';
import { controller, Status, Res, PATH_PARAMS, inject, AnyObj, NODE_RES, Injector } from '@ditsmod/core';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import fs from 'node:fs';

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
    const map = [
      ['href="./swagger-ui.css"', 'href="./openapi/swagger-ui.css"'],
      ['href="index.css"', 'href="./openapi/index.css"'],
      ['href="./index.css"', 'href="./openapi/index.css"'],
      ['href="./favicon-32x32.png"', 'href="./openapi/favicon-32x32.png"'],
      ['href="./favicon-16x16.png"', 'href="./openapi/favicon-16x16.png"'],

      ['src="./swagger-ui-bundle.js"', 'src="./openapi/swagger-ui-bundle.js"'],
      ['src="./swagger-ui-standalone-preset.js"', 'src="./openapi/swagger-ui-standalone-preset.js"'],
      ['src="./swagger-initializer.js"', 'src="./openapi/swagger-initializer.js"'],
    ];

    let indexHtml = await readFile(`${getAbsoluteFSPath()}/index.html`, 'utf8');
    indexHtml = map.reduce((str, [searchVal, replaceVal]) => {
      return str.replace(searchVal, replaceVal);
    }, indexHtml);

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

  @oasRoute('GET', 'openapi/:file', {
    description: 'SwaggerUI static files',
    parameters: [],
    responses: {
      [Status.OK]: {
        description: 'SwaggerUI static files',
        content: {
          ['text/javascript; charset=utf-8']: {},
          ['text/css; charset=utf-8']: {},
          ['image/png']: {},
        },
      },
    },
  })
  async getStaticFiles(@inject(PATH_PARAMS) params: AnyObj, injector: Injector) {
    const url = params.file as string;
    let contentType = 'text/plain; charset=utf-8';
    if (url.endsWith('.js')) {
      contentType = 'text/javascript; charset=utf-8';
    } else if (url.endsWith('.css')) {
      contentType = 'text/css; charset=utf-8';
    } else if (url.endsWith('.png')) {
      const imagePath = `${getAbsoluteFSPath()}/${url}`;
      const nodeRes = injector.get(NODE_RES);
      nodeRes.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': fs.statSync(imagePath).size,
      });
      return new Promise<void>((resolve, reject) => {
        fs.createReadStream(imagePath)
          .pipe(nodeRes)
          .on('end', () => nodeRes.end(resolve))
          .on('error', reject);
      });
    }
    const file = await readFile(`${getAbsoluteFSPath()}/${url}`, 'utf8');
    this.res.setContentType(contentType).send(file);
  }
}
