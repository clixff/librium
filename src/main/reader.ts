import { ipcMain, dialog, BrowserWindow, app } from "electron";
import fs, { promises as fsPromises } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { getConfig } from "./config";
import { RawBook } from "./rawbook";

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
            openFile(filePath, browserWindow);
        }

    }
    catch (error)
    {
        console.error(error);
    }
});


/**
 * Opens .epub file, checks file signature, then converts it to the right format and open in renderer process
 */
async function openFile(filePath: string, browserWindow: BrowserWindow): Promise<void>
{
    try
    {
        const fileContent: Buffer = await fsPromises.readFile(filePath, { encoding: null });
        /**
         * Compare the first 4 bytes with the .ZIP signature
         */
        const comparsionResult: number = fileContent.compare(Buffer.from([0x50, 0x4B, 0x03, 0x04]), 0, 4, 0, 4);
        console.log('Comparsion result is ', comparsionResult);
        if (comparsionResult !== 0)
        {
            throw new Error('.EPUB file is corrupted');
        }

        const fileCheckSum: string = crypto.createHash('sha1').update(fileContent).digest('hex');
        console.log(`FileCheckSum: ${fileCheckSum}`);
        const booksDirectoryPath: string = getConfig().booksDir;
        fs.access(booksDirectoryPath, fs.constants.F_OK, async (err) =>
        {
            if (err)
            {
                /** 
                 * Create a directory with books if it doesn't already exist 
                 */
                await fsPromises.mkdir(booksDirectoryPath, { recursive: true  });
            }

            const pathToTheOpenedBook: string = path.resolve(booksDirectoryPath, fileCheckSum);

            fs.access(pathToTheOpenedBook, fs.constants.F_OK, async (err) =>
            {
                if (!err)
                {
                    /**
                     * Book with this checksum already exists.
                     * 
                     * TODO: Open this book
                     */
                }
                else
                {
                    /**
                     * Create a directory with book data,
                     * for example ../Documents/epub-reader/Books/886fc4262aeaed4470b34da71e842d4b21f63651/
                     */
                    await fsPromises.mkdir(pathToTheOpenedBook, { recursive: true }); 
                    
                    const rawBook = new RawBook(fileContent, pathToTheOpenedBook, fileCheckSum);

                    await rawBook.parse();

                    /**
                     * Send book data to the renderer process
                     */
                    if (rawBook.bookRef)
                    {
                        if (browserWindow && browserWindow.webContents)
                        {
                            browserWindow.webContents.send('book-loaded', rawBook.bookRef.getExportData());
                            /**
                             * Remove book chunks from the memory
                             */
                            rawBook.bookRef.chunks = [];
                        }
                    }
                }
            });
        });
    }
    catch (error)
    {
        console.error(error);
    }
}







