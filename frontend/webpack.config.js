/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  entry: {
    main: './src/index',
  },
  output: {
    // `filename` provides a template for naming your bundles (remember to use `[name]`)
    filename: '[name].bundle.js',
    // `chunkFilename` provides a template for naming code-split bundles (optional)
    chunkFilename: '[name].bundle.js',
    // `path` is the folder where Webpack will place your bundles
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  devServer: {
    historyApiFallback: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      'fp-ts/lib': 'fp-ts/es6',
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.css',
      chunkFilename: 'styles.css',
    }),
    new HtmlWebpackPlugin({
      template: 'assets/index.html',
    }),
  ],
}
