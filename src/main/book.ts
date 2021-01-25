import path from 'path';
import { promises as fsPromises } from 'fs';
import { IBookChunk } from '../shared/schema';
import { ipcMain } from "electron";
import { getConfig } from './config';


interface IBookDataBase
{
    title: string;
    authors: Array<string>;
    language: string;
    publisher: string;
    symbols: number;
    lastTimeOpened: number;
    cover: string;
}

/**
 * This is used when sending book data to a enderer process
 */
interface IBookToExport extends IBookDataBase
{
    chunks: Array<IBookChunk>;
    id: string;
}

/**
 * This is used when saving book data to disk
 */
interface IBookDataToSave extends IBookDataBase
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
    constructor(saveDirectory: string, bookId: string)
    {
        this.saveDirectory = saveDirectory;
        this.id = bookId;
    }
    /**
     * Saves book info to disk
     */
    async saveMeta(): Promise<void>
    {
        try
        {
            const bookMetadata: IBookDataToSave = {
                title: this.title,
                authors: this.authors,
                language: this.language,
                publisher: this.publisher,
                cover: this.cover,
                lastTimeOpened: this.lastTimeOpened,
                symbols: this.symbols,
                version: '0.1' 
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
            id: this.id
        };

        return bookExportData;
    }
    loadMetadataFromDisk(metadata: IBookDataBase): void
    {
        this.title = metadata.title;
        this.authors = metadata.authors;
        this.cover = metadata.cover;
        this.language = metadata.language;
        this.publisher = metadata.publisher;
        this.lastTimeOpened = metadata.lastTimeOpened;
    }
    updateLastTimeOpened(): void
    {
        this.lastTimeOpened = Math.floor(Date.now() / 1000);
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
        const bookDataParsed: IBookDataBase = JSON.parse(bookDataRaw);
        if (bookDataParsed)
        {
            const book = new Book(bookPath, bookId);
            book.loadMetadataFromDisk(bookDataParsed);
            savedBooks.set(bookId, book);
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
    const booksToExport: Array<IBookToExport> = await getBooksList();
    console.log(`BookToExport: `, booksToExport);

    return booksToExport;
});