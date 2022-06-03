const { merge } = require("webpack-merge");
const commonConfig = require('./webpack.config.common');
const webpackBundleAnalyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


const config = {
    mode: "production",

    // plugins: [
    //     new webpackBundleAnalyzer()
    // ],

    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
}

module.exports = merge(commonConfig, config);