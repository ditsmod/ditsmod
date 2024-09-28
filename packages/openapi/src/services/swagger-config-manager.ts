import { dirname } from 'node:path';
import { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { AppOptions, NodeServer, injectable, Injector, inject, SERVER } from '@ditsmod/core';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

import { SwaggerOptions } from '../swagger-ui/interfaces.js';
import { OasExtensionOptions } from '../types/oas-extension-options.js';

const openapiRoot = dirname(fileURLToPath(import.meta.resolve('@ditsmod/openapi/package.json')));

@injectable()
export class SwaggerConfigManager {
  /**
   * `dist-webpack`
   */
  readonly webpackDist = `${openapiRoot}/dist-webpack`;
  /**
   * `dist/swagger-ui`
   */
  readonly swaggerDist = `${openapiRoot}/dist/swagger-ui`;
  private inited: boolean;

  constructor(
    private appOptions: AppOptions,
    private injectorPerMod: Injector,
    @inject(SERVER) private server: NodeServer,
  ) {}

  async applyConfig() {
    if (this.inited) {
      return;
    }
    const { port, address } = this.server.address() as AddressInfo;
    const path = [this.appOptions.path, 'openapi.yaml'].filter((p) => p).join('/');
    const oasExtensionOptions = this.injectorPerMod.get(OasExtensionOptions, null);
    const oauthOptions = oasExtensionOptions?.swaggerOAuthOptions;
    const swaggerOptions: SwaggerOptions = {
      initUi: { url: `http://${address}:${port}/${path}`, dom_id: '#swagger', queryConfigEnabled: true },
      oauthOptions: oauthOptions || {
        appName: 'Swagger UI Webpack',
        // See https://demo.identityserver.io/ for configuration details.
        clientId: 'implicit',
      },
    };
    const futureFileContent = `export const swaggerOptions = ${JSON.stringify(swaggerOptions)};`;
    const filePath = `${this.swaggerDist}/swagger.config.js`;
    const currentFileContent = await readFile(filePath, 'utf8');
    const dirExists = existsSync(this.webpackDist);
    if (dirExists && currentFileContent == futureFileContent) {
      return;
    }
    await writeFile(filePath, futureFileContent, 'utf8');
    await this.webpackCompile(filePath, currentFileContent);
  }

  protected webpackCompile(filePath: string, currentFileContent: string) {
    const compiler = webpack(this.getWebpackConfig());

    const promise = new Promise<void>((resolve, reject) => {
      compiler.run((err, statsOrUndefined) => {
        if (err) {
          reject(err);
        }

        const stats = statsOrUndefined as webpack.Stats;

        const info = stats.toJson();

        if (stats.hasErrors()) {
          reject(info.errors && info.errors[0]);
        }

        resolve();
        this.inited = true;
      });
    }).catch(async (err) => {
      // Rollback because webpack failed
      await writeFile(filePath, currentFileContent, 'utf8');
      throw err;
    });

    return promise;
  }

  protected getWebpackConfig() {
    const webpackConfig: webpack.Configuration = {
      mode: 'production',
      entry: {
        openapi: `${this.swaggerDist}/index`,
      },
      resolve: {
        extensions: ['.js'],
      },
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.yaml$/,
            use: [{ loader: 'yaml-loader' }, { loader: 'json-loader' }],
          },
          {
            test: /\.css$/,
            use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
          },
        ],
      },
      plugins: [
        new webpack.CleanPlugin(),
        new CopyWebpackPlugin({
          patterns: [
            {
              // Copy the Swagger OAuth2 redirect file to the project root;
              // that file handles the OAuth2 redirect after authenticating the end-user.
              from: fileURLToPath(import.meta.resolve('swagger-ui/dist/oauth2-redirect.html')),
              to: './',
            },
          ],
        }),
        new HtmlWebpackPlugin({ template: `${openapiRoot}/index.html` }),
      ],
      output: {
        filename: '[name].bundle.js',
        path: this.webpackDist,
      },
    };

    return webpackConfig;
  }
}
