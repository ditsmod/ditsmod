import { Logger, ModConfig, RootMetadata } from '@ditsmod/core';
import { Injectable, Injector } from '@ts-stack/di';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { join } from 'path';
import webpack, { CleanPlugin, Configuration } from 'webpack';

import { SwaggegrOAuthOptions } from '../swagger-ui/swagger-o-auth-options';
import { SwaggerOptions } from '../swagger-ui/interfaces';

@Injectable()
export class SwaggerConfigManager {
  readonly webpackDist = join(__dirname, '../../dist-webpack');
  readonly swaggerDist = join(__dirname, '../../dist/swagger-ui');
  private swaggerUiSrc = join(__dirname, '../swagger-ui');
  private inited: boolean;
  private openapiRoot = join(__dirname, '../..');

  constructor(
    private log: Logger,
    private rootMeta: RootMetadata,
    private modConfig: ModConfig,
    private injectorPerMod: Injector
  ) {}

  async applyConfig() {
    if (this.inited) {
      return;
    }
    const { prefixPerMod } = this.modConfig;
    const { port } = this.rootMeta.listenOptions;
    const path = [this.rootMeta.prefixPerApp, prefixPerMod, 'openapi.yaml'].filter((p) => p).join('/');
    const oauthOptions = this.injectorPerMod.get(SwaggegrOAuthOptions, null);
    const swaggerOptions: SwaggerOptions = {
      initUi: { url: `http://localhost:${port}/${path}`, dom_id: '#swagger' },
      oauthOptions: oauthOptions || {
        appName: 'Swagger UI Webpack Demo',
        // See https://demo.identityserver.io/ for configuration details.
        clientId: 'implicit',
      },
    };
    const futureFileContent = `export const swaggerOptions = ${JSON.stringify(swaggerOptions)};`;
    const filePath = require.resolve(`${this.swaggerUiSrc}/swagger.config`);
    const currentFileContent = await readFile(filePath, 'utf8');
    const dirExists = existsSync(this.webpackDist);
    if (dirExists && currentFileContent == futureFileContent) {
      this.log.debug(`Skipping override ${filePath}`);
      return;
    }
    const logMsg = `override ${filePath} from "${currentFileContent}" to "${futureFileContent}"`;
    this.log.debug(`Start ${logMsg}`);
    await writeFile(filePath, futureFileContent, 'utf8');
    await this.webpackCompile(logMsg, filePath, currentFileContent);
  }

  protected webpackCompile(logMsg: string, filePath: string, currentFileContent: string) {
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

        if (stats.hasWarnings()) {
          this.log.warn(info.warnings);
        }

        this.log.trace(
          stats.toString({
            chunks: false, // Makes the build much quieter
            colors: false, // Shows colors
          })
        );

        resolve();
        this.inited = true;

        this.log.debug(`Finish ${logMsg}`);
      });
    }).catch(async (err) => {
      // Rollback because webpack failed
      this.log.error(`Rollback during ${logMsg}`);
      await writeFile(filePath, currentFileContent, 'utf8');
      throw err;
    });

    return promise;
  }

  protected getWebpackConfig() {
    const webpackConfig: Configuration = {
      mode: 'development',
      entry: {
        openapi: require.resolve(`${this.swaggerUiSrc}/index`),
      },
      resolve: {
        extensions: ['.ts', '.js'],
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
        new CleanPlugin(),
        new CopyWebpackPlugin({
          patterns: [
            {
              // Copy the Swagger OAuth2 redirect file to the project root;
              // that file handles the OAuth2 redirect after authenticating the end-user.
              from: require.resolve('swagger-ui/dist/oauth2-redirect.html'),
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
