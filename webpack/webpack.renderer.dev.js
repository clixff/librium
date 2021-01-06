const merge = require('webpack-merge');
const rendererBaseConfig = require('./webpack.renderer.base');
const webpack = require('webpack');

const rendererDevConfig = {
    mode: 'development',
    devServer: {
        port: 45505,
        compress: true,
        hot: true,
        host: '127.0.0.1'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    optimization: {
        minimize: true
    },
    devtool: 'eval',
    module: {
        rules: [
            {
                test: /.css$/,
                use: ['style-loader', {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            auto: true,
                            localIdentName: '[name]__[local]'
                        }
                    }
                }]
            }
        ]
    },
};


module.exports = merge(rendererBaseConfig, rendererDevConfig);
