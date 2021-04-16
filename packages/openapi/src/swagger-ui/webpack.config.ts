import { CleanPlugin, Configuration } from 'webpack';
import { resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export const config: Configuration = {
  mode: 'development',
  entry: {
    app: resolve(__dirname, './index.ts'),
  },
  module: {
    rules: [
      {
        test: /\.yaml$/,
        use: [{ loader: 'json-loader' }, { loader: 'yaml-loader' }],
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
    ],
  },
  plugins: [
    new CleanPlugin({ keep: 'openapi.yaml' }),
    new CopyWebpackPlugin({
      patterns: [
        {
          // Copy the Swagger OAuth2 redirect file to the project root;
          // that file handles the OAuth2 redirect after authenticating the end-user.
          from: 'node_modules/swagger-ui/dist/oauth2-redirect.html',
          to: './',
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: resolve(__dirname, '../../index.html'),
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: resolve(__dirname, '../../dist-swagger-ui'),
  },
};
