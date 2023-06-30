const path = require("path");

module.exports = {
  mode: "development",
  devtool: false,
  entry: {
    thmsn: path.resolve(__dirname, "./src/thmsn.ts"),
    // 'dir2/foo' : path.resolve(__dirname, '/apps/dir2/index.js')
    bot: path.resolve(__dirname, "./src/bot.js"),
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};
