const path = require("path");
const figlet = require("figlet");
const git = require("git-rev-sync");
const pkg = require("./package.json");

const banner = figlet.textSync("DW");
const versionLength = pkg.version.length + 3;
const bannerIncludingVersion = `${banner.slice(0, banner.length - versionLength)}v${pkg.version}`;
console.log(`${bannerIncludingVersion}`);

const date = new Date();
const dateSplit = date.toISOString().split("T");
const buildTimeString = `${dateSplit[0]} ${dateSplit[1].substring(0, dateSplit[1].length - 1)} UTC`;

const commitDateSplit = git.date().toISOString().split("T");
const commitTimeString = `${commitDateSplit[0]} ${commitDateSplit[1].substring(0, commitDateSplit[1].length - 1)} UTC`;

const FULL_BANNER = `/*\n
${bannerIncludingVersion}
  version:  ${pkg.version}
  revision: ${git.branch()}@${git.short()}
              from ${commitTimeString}
  build:    ${buildTimeString} ${git.isDirty() ? `(dirty)` : `(actual)`}
*/\n\n\n`


// class BannerPlugin {
//   constructor(options) {
//     this.banner = options.banner;
//   }

//   apply(compiler) {
//     compiler.hooks.emit.tapAsync('FileListPlugin', (compilation, callback) => {
//       compilation.chunks.forEach(chunk => {
//         chunk.files.forEach(filename => {
//           const asset = compilation.assets[filename];
//           asset._value = this.banner + asset._value; // append banner
//         });
//       });

//       callback();
//     });
//   }
// }

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
  // plugins: [
  //   new BannerPlugin({
  //     banner: FULL_BANNER
  //   }),
  // ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.js|\.ts$/,
        loader: "string-replace-loader",
        options: {
          multiple: [
            { search: "__BUILD_TIME__", replace: () => Date.now() },
            { search: "__REVISION__", replace: () => git.short() },
            { search: "__BANNER__", replace: () => FULL_BANNER },
          ],
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};
