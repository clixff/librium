import path from 'path';
import { promises as fsPromises } from 'fs';

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
}