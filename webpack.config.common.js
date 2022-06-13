/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: false,
    entry: './src/index.tsx',

    module: {
        rules: [
            {
                test: /.(ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
                    },
                },
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-modules-typescript-loader',
                        options: {
                            mode: process.env.CI ? 'verify' : 'emit',
                        },
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                        },
                    },
                ],
            },
        ],
    },

    resolve: {
        extensions: ['.css', '.ts', '.tsx', '.js', '.json'],
    },

    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist'),
    },
    plugins: [
        new HTMLWebpackPlugin({
            template: './public/index.html',
            favicon: './public/favicon.ico',
            manifest: './public/manifest.json',
        }),
    ],

    devServer: {
        static: [{ directory: path.resolve('dist') }, { directory: path.resolve('public') }],
        compress: true,
        port: 9000,
    },
};
