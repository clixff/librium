const merge = require('webpack-merge').merge;
const rendererBaseConfig = require('./webpack.renderer.base');
const webpack = require('webpack');

const rendererDevConfig = {
    mode: 'development',
    devServer: {
        port: 45505,
        compress: true,
        hot: true,
        host: '127.0.0.1',
        stats: 'minimal'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development')
            }
        })
    ],
    optimization: {
        minimize: false
    },
    devtool: 'eval-cheap-source-map',
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

const devConfig = merge(rendererBaseConfig, rendererDevConfig);

/** Use development config with ts-loader */
devConfig.module.rules[0].use.options = {
    configFile: 'tsconfig.dev.json'
};

module.exports = devConfig;
