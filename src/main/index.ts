import { app, BrowserWindow } from 'electron';
import path from 'path';
import { initConfig } from './config';
import { initPaths } from './paths';
import './reader';

const NODE_ENV: 'production'|'development' = process.env.NODE_ENV === 'development' ? process.env.NODE_ENV : 'production';

function createWindow(): void
{
    const window = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: {
            enableRemoteModule: false,
            nodeIntegration: true
        }
    });

    window.on('ready-to-show', () =>  
    {
        window.show();
        if (NODE_ENV === 'development')
        {
            window.webContents.openDevTools();
        }
    });

    if (NODE_ENV === 'development')
    {
        window.loadURL('http://127.0.0.1:45505');
    }
    else
    {
        window.loadFile(path.resolve(__dirname, '../', 'renderer', 'index.html'));
    }
}

app.on('ready', async () => 
{
    await initPaths();
    await initConfig();
    createWindow();
});

