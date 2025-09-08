import { fileURLToPath } from 'node:url';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

import { openapiRoot, swaggerDist, webpackDist } from './constants.js';

applyConfig();

function applyConfig() {
  webpack(getWebpackConfig())?.run((err, statsOrUndefined) => {
    if (err) {
      throw err;
    }

    const stats = statsOrUndefined as webpack.Stats;
    const info = stats.toJson();
    if (stats.hasErrors()) {
      throw info.errors && info.errors[0];
    }
  });
}

function getWebpackConfig() {
  const webpackConfig: webpack.Configuration = {
    mode: 'production',
    entry: {
      openapi: `${swaggerDist}/index`,
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
      path: webpackDist,
    },
  };

  return webpackConfig;
}
