const path = require("path");
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    entry: path.resolve(appDirectory, "src/main.ts"), //path to the main .ts file
    output: {
        path: path.resolve(appDirectory, "dist"),
        publicPath: '/',
        filename: 'bundleName.js' //name for the js file that is created/compiled in memory
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    devServer: {
        host: '0.0.0.0',
        port: 8080, //port that we're using for local host (localhost:8080)
        disableHostCheck: true,
        contentBase: path.resolve(appDirectory, "public"), //tells webpack to serve from the public folder
        publicPath: '/',
        hot: true
    },
    module: {
        rules: [
            {
              test: /\.tsx?$/,
              use: "ts-loader",
              exclude: /node_modules/
            },
            {
			  test: /\.css?$/,
			  use: [
			  	'style-loader',
			  	'css-loader'			  	
			  ],
			  exclude: /node_modules/
			},
			{
			  test: /\.otf?$/,
			  use: "file-loader"
			}
        ]
    },
    node: {
      fs: 'empty'
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "public/index.html")
        }),
        new CleanWebpackPlugin(),
    ],
    mode: "development"
};