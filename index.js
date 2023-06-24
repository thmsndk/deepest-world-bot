const { app, BrowserWindow } = require("electron");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      backgroundThrottling: false,
      webSecurity: false,
    },
  });

  win.loadURL("https://deepestworld.com");
};

app.whenReady().then(() => {
  createWindow();
  import("./bot.js?t=" + Date.now());
});
