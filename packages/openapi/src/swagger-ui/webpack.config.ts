import { CleanPlugin, Configuration } from 'webpack';
import { join, resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export const config: Configuration = {
  mode: 'development',
  context: resolve(__dirname),
  entry: {
    openapi: './index.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devtool: 'inline-source-map',
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
          from: '../../../../node_modules/swagger-ui/dist/oauth2-redirect.html',
          to: './',
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: join(__dirname, '../../index.html'),
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: join(__dirname, '../../dist-swagger-ui'),
  },
};
