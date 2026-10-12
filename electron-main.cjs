const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const http = require('node:http');

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address
        ? address.port
        : null;

      server.close((error) => {
        if (error) return reject(error);
        if (!port) return reject(new Error('Could not find an available port.'));
        resolve(port);
      });
    });
  });
}

function checkServer(port) {
  return new Promise((resolve) => {
    const request = http.get(
      `http://127.0.0.1:${port}/api/health`,
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      }
    );

    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });

    request.on('error', () => resolve(false));
  });
}

async function waitForServer(port) {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    if (await checkServer(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(
    'FixFlow server did not start. Check the application files and server configuration.'
  );
}

async function startDesktopApp() {
  try {
    const appPath = app.getAppPath();
    const dataDir = path.join(app.getPath('userData'), 'data');
    const dbFile = path.join(dataDir, 'db.json');
    const initialDb = path.join(appPath, 'data', 'db.json');

    fs.mkdirSync(dataDir, { recursive: true });

    // Import the existing database only on the first launch.
    if (!fs.existsSync(dbFile) && fs.existsSync(initialDb)) {
      fs.copyFileSync(initialDb, dbFile);
    }

    process.env.NODE_ENV = 'production';
    process.env.FIXFLOW_DATA_DIR = dataDir;
    process.env.FIXFLOW_DIST_DIR = path.join(appPath, 'dist');
    process.env.FIXFLOW_HOST = '127.0.0.1';

    const port = await getAvailablePort();
    process.env.PORT = String(port);

    require(path.join(appPath, 'server.cjs'));

    await waitForServer(port);

    const window = new BrowserWindow({
      width: 1280,
      height: 850,
      minWidth: 900,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });

    require('./desktop-close-confirmation.cjs')(window, dialog);
    window.once('ready-to-show', () => window.show());
    await window.loadURL(`http://127.0.0.1:${port}`);
  } catch (error) {
    console.error('FixFlow desktop startup failed:', error);
    dialog.showErrorBox(
      'FixFlow could not start',
      String(error?.stack || error)
    );
    app.quit();
  }
}

app.whenReady().then(startDesktopApp);

app.on('window-all-closed', () => {
  app.quit();
});
