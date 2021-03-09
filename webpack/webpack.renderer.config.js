const merge = require('webpack-merge').merge;
const rendererBaseConfig = require('./webpack.renderer.base');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const rendererConfig = {
    mode: 'production',
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css'
        })
    ],
    module: {
        rules: [
            {
                test: /.css$/,
                use: [MiniCssExtractPlugin.loader, {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            auto: true,
                            localIdentName: '[hash:base64]'
                        }
                    }
                }]
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [
            '...', new CssMinimizerPlugin()
        ]
    }
};

module.exports = merge(rendererBaseConfig, rendererConfig);