const {
  fork
} = require('child_process');
const path = require('path')

const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron')

const {
  addRootPathToGrpc,
  forwardConsoleToWindow
} = require('./electron/interceptors');


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

  process.env.APP_PATH = app.getAppPath();
  forwardConsoleToWindow(win);
  addRootPathToGrpc();


  let connectInfoDialog;
  ipcMain.on('open.connect.window', () => {
    connectInfoDialog = openConnectInfoDialog(win, connectInfoDialog);
  });

  let relayServerApp;
  ipcMain.on('update.config', (event, config) => {
    console.log('####### reload ########', config)
    try {
      initProcessEnvironment(config.env);
      relayServerApp = restartServer(relayServerApp, config);
      openConnectInfoDialog(win, connectInfoDialog);
    } catch (err) {
      console.log('Failed to load server app!', err);
    }
    console.log('#######  done reload ########')
  });

  ipcMain.on('open.dev.console', () => {
    win && !win.isDestroyed() && win.webContents.openDevTools({
      mode: 'bottom'
    })
  });



}

function openConnectInfoDialog(parent, connectInfoDialog) {
  connectInfoDialog && connectInfoDialog.destroy();
  connectInfoDialog = new BrowserWindow({
    parent,
    alwaysOnTop: true,

    height: 500
  })

  connectInfoDialog.setTitle('Waiting for connection info!');


  connectInfoDialog.loadURL(buildConnectDialogUrl());
  connectInfoDialog.once('ready-to-show', () => {
    connectInfoDialog.show();
  })
  setInterval(() => {
    !connectInfoDialog.isDestroyed() && connectInfoDialog.reload();
  }, 3000);

  return connectInfoDialog;
}

function restartServer(relayServerApp, config) {
  relayServerApp && relayServerApp.kill()
  relayServerApp = fork(path.join(app.getAppPath(), 'electron/startServer.js'), [], {
    stdio: 'pipe'
  });
  relayServerApp.on('message', (msg) => {
    console.log(...msg.args);
  })
  return relayServerApp;
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

function buildConnectDialogUrl() {
  return 'http://localhost:3300/connect';
}

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