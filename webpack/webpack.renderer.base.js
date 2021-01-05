const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.config');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rendererBaseConfig = {
    entry: './src/renderer/index.ts',
    output: {
        path: path.resolve(__dirname, '../', 'dist', 'renderer'),
        filename: 'bundle.js'
    },
    target: 'web',
    plugins: [
        new HtmlWebpackPlugin({
            title: "test",
            template: './src/renderer/index.html'
        })
    ]
};

module.exports = merge(baseConfig, rendererBaseConfig);