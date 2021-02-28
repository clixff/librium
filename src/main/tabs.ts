import { app, BrowserWindow, ipcMain } from 'electron';
import fs, { promises as fsPromises } from 'fs';
import { windowList } from '.';
import { getTabsPath } from './paths';

interface ITab
{
    name: string;
    type: number;
    icon: string | null;
    key: string;
    state: Record<string, unknown> | null;
}

interface ITabsFile
{
    tabs: Array<ITab>,
    active: number;
}


let tabsData: ITabsFile = {
    tabs: [],
    active: 0
};

function loadTabsFile(): Promise<void>
{
    return new Promise((resolve, reject) => 
    {
        const tabsFilePath = getTabsPath();
        if (tabsFilePath)
        {
            fs.access(tabsFilePath, fs.constants.F_OK, async (err) =>
            {
                try
                {
                    if (!err)
                    {
                        const tabsFileContent: string = await fsPromises.readFile(tabsFilePath, { encoding: 'utf-8' });
                        if (tabsFileContent)
                        {
                            const tabsFileParsed: ITabsFile = JSON.parse(tabsFileContent);
                            if (tabsFileParsed)
                            {
                                tabsData = tabsFileParsed;
                                resolve();
                            }
                        }
                        else
                        {
                            resolve();
                        }
                    }
                    else
                    {
                        resolve();
                    }
                }
                catch (error)
                {
                    console.error(error);
                    reject(error);
                }

            });
        }
        else
        {
            reject();
        }
    });
}

ipcMain.handle('load-tabs', async () =>
{
    try
    {
        await loadTabsFile();
    }
    catch (error)
    {
        console.error(error);
    }

    return tabsData;
});

async function saveTabsToDisk(): Promise<void>
{
    try
    {
        await fsPromises.writeFile(getTabsPath(), JSON.stringify(tabsData), { encoding: 'utf-8' });
    }
    catch (error)
    {
        console.error(error);
    }
}

ipcMain.on('save-tabs', (event, tabs: Array<ITab>, active: number) =>
{
    tabsData.tabs = tabs;
    tabsData.active = active;
});

app.on('before-quit', () =>
{
    saveTabsToDisk();
});
