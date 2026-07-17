const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// The .env file lives at the repo root and is optional: without it (e.g. a
// fresh clone) the build falls back to the default local API address.
try {
  process.loadEnvFile(path.resolve(__dirname, "../.env"));
} catch {
  // No .env — the fallback below applies.
}
const API_URL = process.env.API_URL ?? "http://localhost:3000";

module.exports = {
  context: __dirname,
  entry: "./src/index.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
    clean: true
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }]
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "./src/index.html" }),
    new webpack.DefinePlugin({
      "process.env.API_URL": JSON.stringify(API_URL)
    })
  ],
  devServer: {
    // Must stay on 5173: the Rails CORS config only allows this origin.
    port: 5173,
    hot: true
  }
};
