
function addRootPathToGrpc() {
    const grpc = require("grpc");
    const load = grpc.load.bind(grpc);
    grpc.load = function (filename, format, options) {
      if (typeof filename === 'string') {
        filename = {
          root: process.env.APP_PATH,
          file: filename
        }
      }
      return load(filename, format, options);
    }
  }
  
  function forwardConsoleToWindow(win) {
    const log = console.log.bind(console)
    console.log = (...args) => {
      log(...args)
      win.webContents.send('console.log', {
        args
      });
    }
  
    const error = console.error.bind(console)
    console.error = (...args) => {
      error(...args)
      win.webContents.send('console.error', {
        args
      });
    }
  }
  
module.exports = {
    addRootPathToGrpc,
    forwardConsoleToWindow
}  