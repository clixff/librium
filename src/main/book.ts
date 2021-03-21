import path from 'path';
import fs, { promises as fsPromises } from 'fs';
import { IBookChunk, IBookmark, ITOC } from '../shared/schema';
import { ipcMain, app } from "electron";
import { getConfig } from './config';
import { ICategory, loadCategories } from './misc/category';


interface IBookBaseData
{
    title: string;
    authors: Array<string>;
    language: string;
    publisher: string;
    symbols: number;
    lastTimeOpened: number;
    cover: string;
    percentRead: number;
    percentPages: number;
    styles: Array<string>;
    tableOfContents: Array<ITOC>;
    bookmarks: Array<IBookmark>;
}

/**
 * This is used when sending book data to a renderer process
 */
interface IBookToExport extends IBookBaseData
{
    chunks: Array<IBookChunk>;
    id: string;
}

/**
 * This is used when saving book data to disk
 */
interface IBookDataToSave extends IBookBaseData
{
    /**
     * Version of the converter
     */
    version: string;
}

export class Book
{
    title = '';
    authors: Array<string> = [];
    language = '';
    publisher = '';
    /**
     * URL to the cover image
     */
    cover = '';
    /**
     * Directory where to save book data on disk
     */
    saveDirectory = '';
    /**
     * List of book chunks
     */
    chunks: Array<IBookChunk> = [];
    /**
     * Number of symbols
     */
    symbols = 0;
    /**
     * Seconds from 1970 until the last time the book was opened
     */
    lastTimeOpened = 0;
    /**
     * Unique book id
     */
    id = '';
    /**
     * Percentage of read in the book.
     * Used to auto scroll after reopening the book.
     */
    percentRead = 0;
    /**
     * Percentage of pages read in the book
     */
    percentPages = 0;
    saveTimeout: NodeJS.Timeout | null = null;
    /**
     * List of paths to CSS files
     */
    styles: Array<string> = [];

    tableOfContents: Array<ITOC> = [];

    bookmarks: Array<IBookmark> = [];
    constructor(saveDirectory: string, bookId: string)
    {
        this.saveDirectory = saveDirectory;
        this.id = bookId;
        savedBooks.set(bookId, this);
    }
    /**
     * Saves book info to disk
     */
    async saveMeta(): Promise<void>
    {
        try
        {
            this.clearSaveTimeout();
            const bookMetadata: IBookDataToSave = {
                title: this.title,
                authors: this.authors,
                language: this.language,
                publisher: this.publisher,
                cover: this.cover,
                lastTimeOpened: this.lastTimeOpened,
                symbols: this.symbols,
                percentRead: this.percentRead,
                percentPages: this.percentPages,
                version: '0.1',
                styles: this.styles,
                tableOfContents: this.tableOfContents,
                bookmarks: this.bookmarks
            };
            const filePath = path.join(this.saveDirectory, 'book.json');
            await fsPromises.writeFile(filePath, JSON.stringify(bookMetadata, null, '\t'), { encoding: 'utf-8' });
        }
        catch (error)
        {
            console.error(error);
        }
    }
    /**
     * Gets an object with book data that will be sent to a renderer process
     */
    getExportData(): IBookToExport
    {
        const bookExportData: IBookToExport = {
            title: this.title,
            authors: this.authors,
            language: this.language,
            publisher: this.publisher,
            chunks: this.chunks,
            symbols: this.symbols,
            lastTimeOpened: this.lastTimeOpened,
            cover: this.cover,
            id: this.id,
            percentRead: this.percentRead,
            percentPages: this.percentPages,
            styles: this.styles,
            tableOfContents: this.tableOfContents,
            bookmarks: this.bookmarks
        };

        return bookExportData;
    }
    loadMetadataFromDisk(metadata: IBookBaseData): void
    {
        this.title = metadata.title || '';
        this.authors = metadata.authors || [];
        this.cover = metadata.cover || '';
        this.language = metadata.language || '';
        this.publisher = metadata.publisher || '';
        this.lastTimeOpened = metadata.lastTimeOpened || 0;
        this.percentRead = metadata.percentRead || 0;
        this.percentPages = metadata.percentPages || 0;
        this.styles = metadata.styles || [];
        this.tableOfContents = metadata.tableOfContents || [];
        this.bookmarks = metadata.bookmarks || [];
    }
    updateLastTimeOpened(): void
    {
        this.lastTimeOpened = Math.floor(Date.now() / 1000);
    }
    async loadChunks(): Promise<void>
    {
        try
        {
            /**
             * Chunks already loaded
             */
            if (this.chunks.length)
            {
                return;
            }
            const chunksPath = path.join(this.saveDirectory, 'chunks');
            await fsPromises.access(chunksPath, fs.constants.F_OK);
            const fileNames: Array<string> = await fsPromises.readdir(chunksPath);
            for (let i = 0; i < fileNames.length; i++)
            {
                const fileName = fileNames[i];

                if (!fileName.endsWith('.json'))
                {
                    continue;
                }

                /**
                 * Number of chunk
                 */
                const chunkId = Number(fileName.slice(0, -5));

                if (!isFinite(chunkId))
                {
                    continue;
                }

                const filePath = path.join(chunksPath, fileName);
                const bIsFile = (await fsPromises.stat(filePath)).isFile;

                if (!bIsFile)
                {
                    continue;
                }

                const fileContent = await fsPromises.readFile(filePath, { encoding: 'utf-8' });

                if (fileContent)
                {
                    const chunkParsed: IBookChunk = JSON.parse(fileContent);
                    this.chunks[chunkId] = chunkParsed;
                }
                
            }
        }
        catch (error)
        {
            console.error(error);
        }
    }
    saveMetaWithTimeout(milliseconds: number): void
    {
        if (this.saveTimeout)
        {
            return;
        }

        this.saveTimeout = setTimeout(() => 
        {
            this.saveMeta();
        }, milliseconds);
    }
    clearSaveTimeout(): void
    {
        if (this.saveTimeout)
        {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
    }
}

const savedBooks: Map<string, Book> = new Map();

async function getBookDataFromDisk(bookPath: string, bookId: string): Promise<IBookToExport | null>
{
    try
    {
        const bIsDirectory = (await fsPromises.stat(bookPath)).isDirectory;
        if (!bIsDirectory)
        {
            return null;
        }

        const bookDataPath: string = path.join(bookPath, 'book.json');
        const bookDataRaw: string = await fsPromises.readFile(bookDataPath, { encoding: 'utf-8' });
        const bookDataParsed: IBookBaseData = JSON.parse(bookDataRaw);
        if (bookDataParsed)
        {
            const book = new Book(bookPath, bookId);
            book.loadMetadataFromDisk(bookDataParsed);
            return book.getExportData();
        }
    }
    catch (error)
    {
        console.error(error);
    }
    return null;
}

async function getBooksList(): Promise<Array<IBookToExport>>
{
    try
    {
        const booksToExport: Array<IBookToExport> = [];

        const config = getConfig();
        
        if (config && config.booksDir)
        {
            const booksDirPath: string = config.booksDir;
            const subDirectories = await fsPromises.readdir(booksDirPath);
            for (const subDirectory of subDirectories)
            {
                const bookData: IBookToExport | null = await getBookDataFromDisk(path.join(booksDirPath, subDirectory), subDirectory);
                if (bookData)
                {
                    booksToExport.push(bookData);
                }
            }
        }

        return booksToExport;
    }
    catch (error)
    {
        console.error(error);
    }
    return [];
}

ipcMain.handle('load-saved-books', async () => 
{
    try
    {
        const booksToExport: Array<IBookToExport> = await getBooksList();
        // console.log(`BookToExport: `, booksToExport);
        const categoriesList: Array<ICategory> = await loadCategories();
    
        return [booksToExport, categoriesList];
    }
    catch (error)
    {
        console.error(error);   
    }

    return [[], []];
});

ipcMain.on('delete-book', async (event, bookId: string) => 
{
    try
    {
        const config = getConfig();
        if (config && config.booksDir)
        {
            const booksDirPath: string = config.booksDir;
            const bookPath: string = path.join(booksDirPath, bookId);
            savedBooks.delete(bookId);
            await fsPromises.rmdir(bookPath, { recursive: true });
        }
    }
    catch(error)
    {
        console.error(error);
    }
});

ipcMain.handle('load-book-chunks', async (event, bookId: string): Promise<Array<IBookChunk>> =>
{
    try
    {
        const book = savedBooks.get(bookId);
        if (book)
        {
            await book.loadChunks();
            const chunks = book.chunks;
            /**
             * Remove book chunks from the memory
             */
            book.chunks = [];
            return chunks;
        }
    }
    catch (error)
    {
        console.error(error);
    }
    return [];
});

ipcMain.on('update-book-last-time-opened-time', (event, bookId: string, newTime: number) =>
{
    const book = savedBooks.get(bookId);
    if (book)
    {
        book.lastTimeOpened = newTime;
        book.saveMeta();
    }
});


ipcMain.on('update-book-read-percent', (event, bookId: string, percent: number, percentPages: number, bForce: boolean) =>
{
    const book = savedBooks.get(bookId);
    if (book)
    {
        book.percentRead = percent;
        book.percentPages = percentPages;

        // console.log(`percent: ${percent}. percentPages: ${percentPages}. bForce: ${bForce}`);

        if (bForce)
        {
            book.saveMeta();
        }
        else
        {
            book.saveMetaWithTimeout(10000);
        }
    }
});

/**
 * If some books have an active timeout for saving metadata to disk
 * and app exits, save all metadata now.
 */
async function saveAllBooksMeta(): Promise<void>
{
    try
    {
        savedBooks.forEach(async (book) =>
        {
            try
            {
                /**
                 * If the book has an active save timeout 
                 */
                if (book.saveTimeout)
                {
                    /**
                     * Stop timeout and save now
                     */
                    book.clearSaveTimeout();
                    await book.saveMeta();
                }
            }
            catch (error)
            {
                console.error(error);
            }
        });
    }
    catch (error)
    {
        console.error(error);
    }
}

app.on('before-quit', async () => 
{
    await saveAllBooksMeta();
});

ipcMain.on('add-new-bookmark', (event, bookID: string, bookmark: IBookmark) =>
{
    const book = savedBooks.get(bookID);
    if (book)
    {
        if (!book.bookmarks)
        {
            book.bookmarks = [];
        }

        book.bookmarks.unshift(bookmark);

        book.saveMeta();
    }
});

ipcMain.on('remove-bookmark', (event, bookID: string, bookmarkID: string) =>
{
    const book = savedBooks.get(bookID);

    if (book && book.bookmarks && book.bookmarks.length)
    {
        let bookmarkIndex = -1;

        for (let i = 0; i < book.bookmarks.length; i++)
        {
            const bookmark = book.bookmarks[i];
            
            if (bookmark && bookmark.id === bookmarkID)
            {
                bookmarkIndex = i;
                break;
            }
        }

        if (bookmarkIndex !== -1)
        {
            book.bookmarks.splice(bookmarkIndex, 1);
            book.saveMeta();
        }
    }
});