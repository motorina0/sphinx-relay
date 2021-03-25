const {
  fork
} = require('child_process');
const path = require('path')

const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron')

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


  let relayServerApp; // = fork('./electron/startServer.js');

  ipcMain.on('update.config', (event, config) => {
    console.log('####### reload ########', config)
    relayServerApp && relayServerApp.kill()
    relayServerApp = fork('./electron/startServer.js');
    relayServerApp.send({
      env: config.env
    });
    relayServerApp.on('message', (msg) => {
      console.log(...msg.args);
    })
  });
}

function forwardConsoleToWindow(win) {
  const log = console.log.bind(console)
  console.log = (...args) => {
    log(...args)
    win.webContents.send('console.log', {
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

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', {
    version: app.getVersion()
  });
});