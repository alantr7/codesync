const NodemonPlugin = require('nodemon-webpack-plugin');
const path = require('path');

module.exports = {
    entry: './src/app.ts', // Entry point,
    devtool: 'inline-source-map',
    output: {
        filename: 'bundle.js', // Output filename
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    target: "node",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [new NodemonPlugin()],
    mode: 'development', // Can be 'production' or 'development'
};