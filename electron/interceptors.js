const path = require('path');
const fs = require("fs");

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

function fixPublicIndexFetch() {
  const readFile = fs.readFile.bind(fs);
  fs.readFile = (...args) => {
    if (args[0] === 'public/index.html') {
      args[0] = path.join(process.env.APP_PATH, args[0]);
    }
    return readFile(...args);
  }
}

function forwardConsoleToWindow(win) {
  const log = console.log.bind(console)
  console.log = (...args) => {
    log(...args)
    win && !win.isDestroyed() && win.webContents.send('console.log', {
      args
    });
  }

  const error = console.error.bind(console)
  console.error = (...args) => {
    error(...args)
    win && !win.isDestroyed() && win.webContents.send('console.error', {
      args
    });
  }
}

module.exports = {
  addRootPathToGrpc,
  forwardConsoleToWindow,
  fixPublicIndexFetch,
}