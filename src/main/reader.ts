import { ipcMain, dialog, BrowserWindow, app } from "electron";
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';


import admZip from 'adm-zip';

ipcMain.on('open-file-click', async (event) => 
{
    try
    {
        console.log('Clicked open-file');
        const browserWindow: BrowserWindow | null = BrowserWindow.fromWebContents(event.sender);
        if (!browserWindow)
        {
            throw new Error('BrowserWindow not found in method openFile');
        }
    
        const fileContent: Electron.OpenDialogReturnValue = await dialog.showOpenDialog(browserWindow, { 
            filters: [
                {
                    name: 'Electronic Publication', extensions: ['epub']
                }
            ], 
            properties: ['openFile'] 
        });

        if (!fileContent.canceled && fileContent.filePaths && fileContent.filePaths.length)
        {
            const filePath: string = fileContent.filePaths[0];
            console.log(filePath);
            openFile(filePath);
        }

    }
    catch (error)
    {
        console.error(error);
    }
});


/**
 * Opens .epub file and converts it to a local format
 */
async function openFile(filePath: string): Promise<void>
{
    try
    {
        const fileContent: Buffer = await fsPromises.readFile(filePath, { encoding: null });
        /**
         * Compare first 4 bytes with a .ZIP signature
         */
        const comparsionResult: number = fileContent.compare(Buffer.from([0x50, 0x4B, 0x03, 0x04]), 0, 4, 0, 4);
        console.log('Comparsion result is ', comparsionResult);
        if (comparsionResult !== 0)
        {
            throw new Error('.EPUB file is corrupted');
        }

        const fileCheckSum: string = crypto.createHash('sha1').update(fileContent).digest('hex');
        console.log(`FileCheckSum: ${fileCheckSum}`);
        console.log(app.getPath('userData'));
    }
    catch (error)
    {
        console.error(error);
    }
}