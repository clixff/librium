import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initConfig } from './config';
import { startHTTPServer } from './misc/server';
import { initPaths } from './paths';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { openFile } from './reader';
import './misc/windows';
import './tabs';
import { openLinkInBrowser } from './misc/links';
import { findEpubFileInArgvList } from './reader';

const NODE_ENV: 'production' | 'development' = process.env.NODE_ENV === 'development' ? process.env.NODE_ENV : 'production';

export const windowList: Array<BrowserWindow> = [];
export const windowArgv: Array<Array<string>> = [];
let activeWindow: BrowserWindow | null = null;

export function getActiveWindow(): BrowserWindow | null
{
    return activeWindow;
}

function createWindow(argv: Array<string>): void
{
    const window = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        frame: false,
        minWidth: 700,
        minHeight: 500,
        webPreferences: {
            enableRemoteModule: false,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    console.log(`Creating window with id ${window.id}`);
    
    windowList.push(window);
    windowArgv.push(argv);
    activeWindow = activeWindow;

    window.webContents.on('new-window', openLinkInBrowser);
    window.webContents.on('will-navigate', openLinkInBrowser);

    window.on('ready-to-show', () =>  
    {
        window.show();
        if (NODE_ENV === 'development' || true)
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

    window.on('close', () =>
    {
        const windowID = findWindowID(window);
        if (windowID !== -1)
        {
            windowList.splice(windowID, 1);
            windowArgv.splice(windowID, 1);
        }

        if (activeWindow === window)
        {
            if (windowList.length > 1)
            {
                activeWindow = windowList[0];
            }
            else
            {
                activeWindow = null;
            }
        }
    });

    window.on('focus', () =>
    {
        activeWindow = window;
    });

    /**
     * This disables Ctrl+W shortcut
     */
    window.setMenu(null);
}

async function handleAppReady(): Promise<void>
{
    try
    {    
        await initPaths();
        await initConfig();
        await startHTTPServer();
    
        if (NODE_ENV === 'development')
        {
            try 
            {
                const name = await installExtension([REACT_DEVELOPER_TOOLS]);
                console.log(`Extension ${name} successfully installed`);
            }
            catch (error)
            {
                console.error(`Error installing developer extensions: `, error);
            }
        }
    
        createWindow(process.argv);
    }
    catch(error)
    {
        console.error(error);
    }
}

/**
 * Second app instance opened
 */
async function handleSecondInstance(event, argv): Promise<void>
{
    try
    {
        const bookPath = findEpubFileInArgvList(argv);

        if (bookPath && activeWindow)
        {
            openFile(bookPath, activeWindow);

            if (activeWindow.isMinimized())
			{
				activeWindow.restore();
			}
            
			activeWindow.focus();
        }
        else
        {
            createWindow(argv);
        }
    }
    catch (error)
    {
        console.error(error);
    }
}

app.on('window-all-closed', async () =>
{
    app.quit();
});


const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock)
{
    /**
     * Close dublicate app instance
     */
    app.quit();
}
else
{
    app.on('second-instance', handleSecondInstance);

    app.on('ready', handleAppReady);
}

export function findWindowID(browserWindow: BrowserWindow): number
{
    for (let i = 0; i < windowList.length; i++)
    {
        const window = windowList[i];
        if (window.id === browserWindow.id)
        {
            return i;
        }
    }

    return -1;
}

ipcMain.handle('get-argv', async (event) =>
{
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    if (browserWindow)
    {
        const windowID = findWindowID(browserWindow);
        if (windowID !== -1)
        {
            return windowArgv[windowID];
        }
    }
    return null;
});


ipcMain.on('change-full-screen-mode', (event, newFullScreenState) =>
{
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    if (browserWindow)
    {
        browserWindow.setFullScreen(newFullScreenState);
    }
});