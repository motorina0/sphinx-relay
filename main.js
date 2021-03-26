const {
  fork
} = require('child_process');
const path = require('path')

const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron')

console.log('######################### main #########################')

function createWindow(op = {}) {
  console.log('###################### op: ', op)
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools({
    mode: 'bottom'
  })

  forwardConsoleToWindow(win);
  addRootPathToGrpc();

  let relayServerApp;

  ipcMain.on('update.config', (event, config) => {
    console.log('####### reload ########', config)
    try {
      initProcessEnvironment(config.env);
      relayServerApp = restartServer(relayServerApp, config);

      // require('./dist/app');
    } catch (err) {
      console.log('Failed to load server app!', err);
    }
    console.log('#######  done reload ########')
  });
}

function restartServer(relayServerApp, config) {
  relayServerApp && relayServerApp.kill()
  relayServerApp = fork(path.join(app.getAppPath(), 'electron/startServer.js'), [], {
    stdio: 'pipe'
  });
  // relayServerApp = fork('./electron/startServer.js');
  relayServerApp.send({
    env: config.env
  });
  relayServerApp.on('message', (msg) => {
    console.log(...msg.args);
  })
  return relayServerApp;
}

function addRootPathToGrpc() {
  const grpc = require("grpc");
  const load = grpc.load.bind(grpc);
  grpc.load = function (filename, format, options) {
    if (typeof filename === 'string') {
      filename = {
        root: app.getAppPath(),
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


app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function initProcessEnvironment(env = {}) {
  process.env.PORT = env.port || "3300"
  process.env.NODE_IP = env.node_ip || "0.0.0.0"
  process.env.NODE_ENV = env.node_env || "production"
  process.env.LND_IP = env.lnd_ip || "localhost"
  process.env.LND_PORT = env.lnd_port || "11009"
  process.env.MACAROON_LOCATION = env.macaroon_location || "/Users/moto/Documents/GitHub/bitcoincoretech/ln-dev-tutorial/src/lnd/docker/prod/volumes/.lnd/data/chain/bitcoin/mainnet/admin.macaroon"
  process.env.TLS_LOCATION = env.tls_location || "/Users/moto/Documents/GitHub/bitcoincoretech/ln-dev-tutorial/src/lnd/docker/prod/volumes/.lnd/tls.cert"
  process.env.PUBLIC_URL = env.public_url || "localhost:3300"
  process.env.CONNECT_UI = true
}