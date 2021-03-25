const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron')
const path = require('path')



function createWindow(op = {}) {
  console.log('!!!!!!!!!!!!!!!!!!!')
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

  initProcessEnvironment(op.env)

  const log = console.log.bind(console)
  console.log = (...args) => {
    log(...args)
    win.webContents.send('console.log', {
      args
    });
  }

  require('./dist/app')
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

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', {
    version: app.getVersion()
  });
});