const merge = require('webpack-merge').merge;
const baseConfig = require('./webpack.base.config');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rendererBaseConfig = {
    entry: './src/renderer/index.ts',
    output: {
        path: path.resolve(__dirname, '../', 'dist', 'renderer'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /.svg$/,
                use: [
                    {
                        loader: 'babel-loader'
                    },
                    {
                        loader: 'react-svg-loader',
                        options: {
                            jsx: true
                        }
                    }
                ]
            }
        ]
    },
    target: 'electron-renderer',
    plugins: [
        new HtmlWebpackPlugin({
            title: "test",
            template: './src/renderer/index.html'
        })
    ]
};

module.exports = merge(baseConfig, rendererBaseConfig);