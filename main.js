const { app, BrowserWindow, ipcMain } = require('electron');
const { Launcher, MicrosoftAuth } = require('eml-lib');
const path = require('path');
const axios = require('axios');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  win.loadFile('index.html');
  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  ipcMain.on('launch-game', async (event) => {
    try {
      // 1. Connexion du joueur via son compte Microsoft officiel
      win.webContents.send('status', 'Connexion au compte Microsoft...');
      const auth = new MicrosoftAuth();
      const account = await auth.login();

      // 2. Téléchargement du fichier config.json depuis ton GitHub Pages
      win.webContents.send('status', 'Vérification des mises à jour...');
      const response = await axios.get('https://astriaz.github.io/minecraft-launcher-files/versions/1.20.4/config.json');
      const remoteConfig = response.data;

      // 3. Configuration du lancement vers ton serveur
      const launcher = new Launcher({
        root: path.join(app.getPath('userData'), 'game_files'),
        account: account,
        minecraft: {
          version: remoteConfig.gameVersion,
          server: {
            ip: remoteConfig.serverAddress,
            port: 25565
          }
        }
      });

      // Suivi du téléchargement des mods s'il y en a de nouveaux
      launcher.on('download', (e) => {
        win.webContents.send('status', `Téléchargement : ${e.name} (${e.current}/${e.total})`);
      });

      launcher.on('launch', () => {
        win.webContents.send('status', 'Lancement de Minecraft...');
      });

      // 4. Lancement effectif du jeu direct sur ton serveur
      await launcher.launch();

    } catch (error) {
      console.error(error);
      win.webContents.send('status', 'Erreur lors du lancement.');
    }
  });
});
