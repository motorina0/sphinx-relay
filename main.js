const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path')



function createWindow () {
  console.log('!!!!!!!!!!!!!!!!!!!')
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools()

  process.env.PORT="3300"
  process.env.NODE_IP="0.0.0.0"
  process.env.NODE_ENV="production"
  process.env.LND_IP="localhost"
  process.env.LND_PORT="11009"
  process.env.MACAROON_LOCATION="/Users/moto/Documents/GitHub/bitcoincoretech/ln-dev-tutorial/src/lnd/docker/prod/volumes/.lnd/data/chain/bitcoin/mainnet/admin.macaroon"
  process.env.TLS_LOCATION="/Users/moto/Documents/GitHub/bitcoincoretech/ln-dev-tutorial/src/lnd/docker/prod/volumes/.lnd/tls.cert"
  process.env.PUBLIC_URL="localhost:3300"
  process.env.CONNECT_UI=true

  const log = console.log.bind(console)
  console.log = (...args) => {
    log(...args)
    win.webContents.send('console.log', { args });
  }

  require('./dist/app')
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
  event.sender.send('app_version', { version: app.getVersion() });
});