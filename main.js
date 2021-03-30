const {
  fork
} = require('child_process');
const path = require('path')
const got = require('got');

const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron');



const {
  addRootPathToGrpc,
  forwardConsoleToWindow
} = require('./electron/server/interceptors');

const storage = require('./electron/storage');


function createWindow(op = {}) {
  try {
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

    console.log('!!!!!!!!!!!!!!!!!!!!! process.env.APP_PATH',process.env.APP_PATH);
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
        relayServerApp = restartServer(relayServerApp);
      } catch (err) {
        console.log('Failed to load server app!', err);
      }
    });

    ipcMain.on('open.dev.console', () => {
      win && !win.isDestroyed() && win.webContents.openDevTools({
        mode: 'bottom'
      })
    });

    setTimeout(() => {
      updateUIValues(win);
    }, 1000);


    setInterval(async () => {
      await pingConnectPage(win);
    }, 3000);

  } catch (err) {
    console.error('Failed to create new window!');
    console.error(err);
  }

}

function updateUIValues(win) {
  storage.get('env', function (error, env) {
    if (error) {
      console.error(error);
      return;
    }
    if (env) {
      win && !win.isDestroyed() && win.webContents.send('env.update', env);
    }
  });
}

async function pingConnectPage(win) {
  win && !win.isDestroyed() && win.webContents.send('status.update', {
    retry: true
  });
  let statusCode = '';
  try {
    const response = await got(`${process.env.NODE_HTTP_PROTOCOL}://${process.env.NODE_IP}:${process.env.PORT}/connect`, {
      timeout: 2000
    });
    statusCode = response.statusCode;
  } catch {}
  win && !win.isDestroyed() && win.webContents.send('status.update', {
    statusCode
  });
}

function openConnectInfoDialog(parent, connectInfoDialog) {
  console.log("########################## 1.2.3")

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

function restartServer(relayServerApp) {
  relayServerApp && relayServerApp.kill()
  relayServerApp = fork(path.join(app.getAppPath(), 'electron/server/startServer.js'), [], {
    stdio: 'pipe'
  });
  relayServerApp.on('message', (msg) => {
    console.log(...msg.args);
  })
  return relayServerApp;
}

app.whenReady().then(() => {
  process.env.APP_PATH = app.getAppPath();
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
  return `${process.env.NODE_HTTP_PROTOCOL}://${process.env.NODE_IP}:${process.env.PORT}/connect`;
}

function initProcessEnvironment(env = {}) {
  storage.set('env', env, function (error) {
    if (error) console.error(error);
  });

  process.env.PORT = env.port;
  process.env.NODE_IP = env.node_ip;
  process.env.NODE_HTTP_PROTOCOL = env.node_http_protocol;
  process.env.NODE_ENV = env.node_env;
  process.env.LND_IP = env.lnd_ip;
  process.env.LND_PORT = env.lnd_port;
  process.env.MACAROON_LOCATION = env.macaroon_location;
  process.env.TLS_LOCATION = env.tls_location;
  process.env.DB_LOCATION = env.db_location;
  process.env.PUBLIC_URL = env.public_url;
  process.env.CONNECT_UI = true
}