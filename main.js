const { app, BrowserWindow } = require('electron')
const path = require('path')



function createWindow () {
  console.log('!!!!!!!!!!!!!!!!!!!')
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools()

  process.env.PORT="3300"
  process.env.NODE_IP="0.0.0.0"
  process.env.NODE_ENV="production"
  process.env.LND_IP="localhost"
  process.env.LND_PORT="11009"
  process.env.MACAROON_LOCATION="/relay/.lnd/macaroons/admin.macaroon"
  process.env.TLS_LOCATION="/relay/.lnd/cert/tls.cert"
  process.env.PUBLIC_URL="localhost:3300"

  console.log('#################### process.env', JSON.stringify(process.env))
  // require('dist/app')
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