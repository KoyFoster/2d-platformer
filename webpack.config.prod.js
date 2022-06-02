const { merge } = require("webpack-merge");
const commonConfig = require('./webpack.config.common');

const config = {
    mode: "production",
}

module.exports = merge(commonConfig, config);