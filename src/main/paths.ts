import { app } from 'electron';
import path from 'path';
import fs, { promises as fsPromises } from 'fs';

export function getAppDataPath(): string
{
    return path.resolve(app.getPath('documents'), 'epub-reader');
}

export function getConfigPath(): string
{
    return path.resolve(getAppDataPath(), 'config.json');
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
                await fsPromises.mkdir(dirPath, { recursive: true });
            }
            resolve();
        });
    });
}

export async function initPaths(): Promise<void>
{
    /**
     * Check if folder `../documents/epub-reader/` exists
     */
    await createDirIfNotExists(getAppDataPath());
}