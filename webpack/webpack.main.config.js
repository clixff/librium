const merge = require('webpack-merge').merge;
const baseConfig = require('./webpack.base.config');
const path = require('path');

const mainConfig = {
    entry: './src/main/index.ts',
    output: {
        path: path.join(__dirname, '../', 'dist', 'main'),
        filename: 'index.js'
    },
    target: 'electron-main'
};

module.exports = merge(baseConfig, mainConfig);