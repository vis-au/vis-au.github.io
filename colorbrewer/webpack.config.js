module.exports = {
  entry: './colorbrewer.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/build',
    publicPath: '/build/'
  },
  target: 'web',
  mode: 'development',

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',
  devServer: {
    publicPath: '/build/',
    contentBase: './public'
  },

  resolve: {
    extensions: ['.js', '.json']
  },

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: {
    // 'react': 'React',
    // 'react-dom': 'ReactDOM'
  }
};