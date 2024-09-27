import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppOptions, ModuleExtract, NodeServer, injectable, Injector, inject, SERVER } from '@ditsmod/core';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { join } from 'path';
import webpack from 'webpack';

import { SwaggerOptions } from '../swagger-ui/interfaces.js';
import { OasExtensionOptions } from '../types/oas-extension-options.js';
import { AddressInfo } from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));

@injectable()
export class SwaggerConfigManager {
  readonly webpackDist = join(__dirname, '../../dist-webpack');
  readonly swaggerDist = join(__dirname, '../../dist/swagger-ui');
  private swaggerUiSrc = join(__dirname, '../swagger-ui');
  private inited: boolean;
  private openapiRoot = join(__dirname, '../..');

  constructor(
    private appOptions: AppOptions,
    private moduleExtract: ModuleExtract,
    private injectorPerMod: Injector,
    @inject(SERVER) private server: NodeServer,
  ) {}

  async applyConfig() {
    if (this.inited) {
      return;
    }
    const { path: prefixPerMod } = this.moduleExtract;
    const { port } = this.server.address() as AddressInfo;
    const path = [this.appOptions.path, prefixPerMod, 'openapi.yaml'].filter((p) => p).join('/');
    const oasExtensionOptions = this.injectorPerMod.get(OasExtensionOptions, null);
    const oauthOptions = oasExtensionOptions?.swaggerOAuthOptions;
    const swaggerOptions: SwaggerOptions = {
      initUi: { url: `http://0.0.0.0:${port}/${path}`, dom_id: '#swagger' },
      oauthOptions: oauthOptions || {
        appName: 'Swagger UI Webpack Demo',
        // See https://demo.identityserver.io/ for configuration details.
        clientId: 'implicit',
      },
    };
    const futureFileContent = `export const swaggerOptions = ${JSON.stringify(swaggerOptions)};`;
    const filePath = fileURLToPath(import.meta.resolve(`${this.swaggerUiSrc}/swagger.config.js`));
    const currentFileContent = await readFile(filePath, 'utf8');
    const dirExists = existsSync(this.webpackDist);
    if (dirExists && currentFileContent == futureFileContent) {
      return;
    }
    await writeFile(filePath, futureFileContent, 'utf8');
    await this.webpackCompile(filePath, currentFileContent, futureFileContent);
  }

  protected webpackCompile(filePath: string, currentFileContent: string, futureFileContent: string) {
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
      mode: 'development',
      entry: {
        openapi: fileURLToPath(import.meta.resolve(`${this.swaggerUiSrc}/index.js`)),
      },
      resolve: {
        extensions: ['.ts', '.js'],
        fallback: { stream: fileURLToPath(import.meta.resolve('stream-browserify')) },
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
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
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
        new HtmlWebpackPlugin({
          template: `${this.openapiRoot}/index.html`,
        }),
      ],
      output: {
        filename: '[name].bundle.js',
        path: this.webpackDist,
      },
    };

    return webpackConfig;
  }
}
