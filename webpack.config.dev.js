const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.config.common');

const config = {
    mode: 'development',
};

module.exports = merge(commonConfig, config);
