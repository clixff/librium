import path from 'path';
import { promises as fsPromises } from 'fs';
import { IBookChunk } from '../shared/schema';

/**
 * This is used when sending book data to a enderer process
 */
interface IBookToExport
{
    title: string;
    authors: Array<string>;
    language: string;
    publisher: string;
    chunks: Array<IBookChunk>;
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
    constructor(saveDirectory: string)
    {
        this.saveDirectory = saveDirectory;
    }
    async saveMeta(): Promise<void>
    {
        try
        {
            const bookMetadata: Record<string, unknown> = {
                title: this.title,
                authors: this.authors,
                language: this.language,
                publisher: this.publisher,
                cover: this.cover
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
            chunks: this.chunks
        };

        return bookExportData;
    }
}