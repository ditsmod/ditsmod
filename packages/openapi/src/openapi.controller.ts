import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Controller, Logger, Request, Response, Status } from '@ditsmod/core';
import webpack from 'webpack';

import { config } from './swagger-ui/webpack.config';
import { OasRoute } from './decorators/oas-route';

@Controller()
export class OpenapiController {
  constructor(private req: Request, private res: Response, private log: Logger) {}

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
    const apply = this.req.queryParams?.apply;
    if (apply && apply != 'false' && apply != '0') {
      await this.applyOasConfig();
    }
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

  protected applyOasConfig(url?: string) {
    url = url || 'http://localhost:8080/openapi.yaml';
    const fileContent = `export const url = '${url}';\n`;
    const filePath = join(__dirname, './swagger-ui/swagger.config.ts');
    writeFileSync(filePath, fileContent, { encoding: 'utf8' });
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
    return join(__dirname, '../dist-swagger-ui');
  }

  protected get dist() {
    return join(__dirname, '../dist');
  }
}
