import webpack, { CleanPlugin } from 'webpack';
import { resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const compiler = webpack({
  mode: 'development',
  entry: {
    app: resolve(__dirname, './index.js'),
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
});

compiler.run((err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if ((err as any).details) {
      console.error((err as any).details);
    }
    return;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }

  console.log(
    stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true, // Shows colors in the console
    })
  );
  // Log result...
});
