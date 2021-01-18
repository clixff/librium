import { BrowserWindow, ipcMain } from "electron";
import { TitlebarButtonType } from "../../shared/misc";


ipcMain.on('titlebar-button-clicked', (event, type: TitlebarButtonType) =>
{
    const browserWindow: BrowserWindow | null = BrowserWindow.fromWebContents(event.sender);
    if (!browserWindow)
    {
        return;
    }

    switch (type) 
    {
        case 'close':
            browserWindow.close();
            break;
        case 'maximize':
            if (browserWindow.isMaximized())
            {
                browserWindow.unmaximize();
            }
            else
            {
                browserWindow.maximize();
            }
            break;
        case 'minimize':
            browserWindow.minimize();
            break;
    }
});