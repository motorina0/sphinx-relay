const {
  fork
} = require('child_process');
const path = require('path')
const got = require('got');

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

  setInterval(async () => {
    await pingConnectPage(win);
  }, 3000);
}

async function pingConnectPage(win) {
  win && !win.isDestroyed() && win.webContents.send('status.update', {
    retry: true
  });
  let statusCode = '';
  try {
    const response = await got('http://localhost:3300/connect', {
      timeout: 2000
    });
    statusCode = response.statusCode;
  } catch {}
  win && !win.isDestroyed() && win.webContents.send('status.update', {
    statusCode
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
  process.env.PORT = env.port;
  process.env.NODE_IP = env.node_ip;
  process.env.NODE_ENV = env.node_env;
  process.env.LND_IP = env.lnd_ip;
  process.env.LND_PORT = env.lnd_port;
  process.env.MACAROON_LOCATION = env.macaroon_location;
  process.env.TLS_LOCATION = env.tls_location;
  process.env.DB_LOCATION = env.db_location;
  process.env.PUBLIC_URL = env.public_url;
  process.env.CONNECT_UI = true
}