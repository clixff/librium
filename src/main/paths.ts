import { app } from 'electron';
import path from 'path';
import fs, { promises as fsPromises } from 'fs';

export function getAppDataPath(): string
{
    return path.resolve(app.getPath('appData'), 'epub-reader');
}

export function getSettingFolderPath(): string
{
    return path.resolve(getAppDataPath(), 'main');
}

export function getConfigPath(): string
{
    return path.resolve(getSettingFolderPath(), 'config.json');
}

/**
 * Creates a new directory if it doesn't already exist
 */
export function createDirIfNotExists(dirPath: string): Promise<void>
{
    return new Promise((resolve) => 
    {
        fs.access(dirPath, fs.constants.F_OK, async (err) => 
        {
            if (err)
            {
                await fsPromises.mkdir(dirPath);
            }
            resolve();
        });
    });
}

export async function initPaths(): Promise<void>
{
    /**
     * Check if folder `../AppData/Roaming/epub-reader/` exists
     */
    await createDirIfNotExists(getAppDataPath());
    /**
     * Check if folder `../AppData/Roaming/epub-reader/main` exists
     */
    await createDirIfNotExists(getSettingFolderPath());
}