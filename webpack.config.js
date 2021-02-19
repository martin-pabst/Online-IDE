const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const ideConfig = {
    mode: 'production', // development
    context: path.resolve(__dirname, 'htdocs'),
    entry: {
        home: [
            './js/main/IDEStarter.js',
            './css/editor.css',
            './css/bottomdiv.css',
            './css/debugger.css',
            './css/diagram.css',
            './css/helper.css',
            './css/icons.css',
            './css/imagesprites.css',
            './css/run.css',
            './css/dialog.css',
            './assets/fonts/fonts.css',
        ],
        // style: [
        //     './htdocs/css/embedded.css'
        // ]
    },
    devtool: 'source-map',
    performance: {
        hints: false
    },
    output: {
        path: path.resolve(__dirname, 'htdocs/js.webpack'),
        filename: 'javaOnline.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader", "source-map-loader"],
                enforce: "pre"
            }, {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },{
                test: /\.(png|jpe?g|gif|woff|woff2|svg|ttf|eot)$/i,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                        emitFile: false,
                        name: '../[path][name].[ext]'
                      },
                  },
                ],
              },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // all options are optional
          filename: 'javaOnline.css',
          chunkFilename: 'Chunkfile.css',
          ignoreOrder: false, // Enable to remove warnings about conflicting order
        }),
      ]
}

const embeddedConfig = {
    mode: 'production', // development
    context: path.resolve(__dirname, 'htdocs'),
    entry: {
        home: [
            './js/embedded/EmbeddedStarter.js',
            './css/editor.css',
            './css/bottomdiv.css',
            './css/debugger.css',
            './css/diagram.css',
            './css/helper.css',
            './css/icons.css',
            './css/imagesprites.css',
            './css/run.css',
            './assets/fonts/fonts.css',
            './css/embedded.css',
        ],
        // style: [
        //     './htdocs/css/embedded.css'
        // ]
    },
    devtool: 'source-map',
    performance: {
        hints: false
    },
    output: {
        path: path.resolve(__dirname, 'htdocs/js.webpack'),
        filename: 'javaOnline-embedded.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader", "source-map-loader"],
                enforce: "pre"
            }, {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },{
                test: /\.(png|jpe?g|gif|woff|woff2|svg|ttf|eot)$/i,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                        emitFile: false,
                        name: '../[path][name].[ext]'
                      },
                  },
                ],
              },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // all options are optional
          filename: 'javaOnlineEmbedded.css',
          chunkFilename: 'Chunkfile.css',
          ignoreOrder: false, // Enable to remove warnings about conflicting order
        }),
      ]
}

const apiConfig = {
    mode: 'production', // development
    context: path.resolve(__dirname, 'htdocs'),
    entry: {
        home: [
            './js/help/APIDoc.js'
        ],
        // style: [
        //     './htdocs/css/embedded.css'
        // ]
    },
    devtool: 'source-map',
    performance: {
        hints: false
    },
    output: {
        path: path.resolve(__dirname, 'htdocs/js.webpack'),
        filename: 'javaOnline-apiDoc.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader", "source-map-loader"],
                enforce: "pre"
            }, {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },{
                test: /\.(png|jpe?g|gif|woff|woff2|svg|ttf|eot)$/i,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                        emitFile: false,
                        name: '../[path][name].[ext]'
                      },
                  },
                ],
              },
        ]
    }
}

module.exports = [ideConfig, embeddedConfig, apiConfig];