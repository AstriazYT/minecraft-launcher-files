const { app, BrowserWindow, ipcMain } = require('electron');
const { Client, Authenticator } = require('minecraft-launcher-core');
const path = require('path');
const axios = require('axios');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: { 
      nodeIntegration: true, 
      contextIsolation: false 
    }
  });
  win.loadFile('index.html');
  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  ipcMain.on('launch-game', async () => {
    try {
      win.webContents.send('status', 'Récupération de la configuration...');
      const response = await axios.get('https://astriaz.github.io/minecraft-launcher-files/versions/1.20.4/config.json');
      const remoteConfig = response.data;

      win.webContents.send('status', 'Connexion Microsoft...');
      // Authentification Microsoft officielle
      const auth = await Authenticator.getAuth("microsoft");

      win.webContents.send('status', 'Préparation du lancement...');
      const launcher = new Client();
      
      const opts = {
        authorization: auth,
        root: path.join(app.getPath('userData'), 'game_files'),
        version: {
          number: remoteConfig.gameVersion,
          type: "release"
        },
        memory: {
          max: "4G",
          min: "2G"
        },
        server: {
          host: remoteConfig.serverAddress,
          port: 25565
        }
      };

      launcher.on('progress', (e) => {
        win.webContents.send('status', `Téléchargement : ${Math.round(e.percent)}%`);
      });

      launcher.on('data', (e) => {
        console.log(e);
      });

      await launcher.launch(opts);
      win.webContents.send('status', 'Jeu lancé !');

    } catch (error) {
      console.error(error);
      win.webContents.send('status', 'Erreur lors du lancement.');
    }
  });
});
