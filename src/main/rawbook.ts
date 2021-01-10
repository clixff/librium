import AdmZip from "adm-zip";
import path from 'path';
import { Book } from "./book";
import { IContainerXMLSchema, IMetadataSchema, IOPFSchema, MetadataItem } from "./misc/schema";
import { parseXML } from "./parser";

/**
 * `.epub` file
 */
export class RawBook
{
    zipArchive: AdmZip;
    /**
     * Directory where to save parsed book
     */
    pathToSave = '';
    /**
     * Path to the `.opf` file (`Open Packaging Format`).
     * 
     * This file contains book's resources and metadata.
     */
    optFilePath = '';
    /**
     * Parsed `.opf` file (XML)
     * 
     * This file contains book's resources and metadata.
     */
    packageOpf: IOPFSchema | null = null;

    /**
     * Ref to the actual book object, that can be parsed by app
     */
    bookRef: Book | null = null;
    constructor(epubContent: Buffer, pathToSave: string)
    {
        this.zipArchive = new AdmZip(epubContent);
        this.pathToSave = pathToSave;
    }
    /**
     * Reads file in the `zipArchive` and converts it to the string
     */
    readFile(filePath: string, encoding = 'utf8'): Promise<string>
    {
        /**
         * Replace double backslashes with frontslashes
         */
        filePath = filePath.replace(/\\/g, '/');
        return new Promise((resolve) =>
        {
            this.zipArchive.readAsTextAsync(filePath, (data) => 
            {
                resolve(data);
            }, encoding);
        });
    }
    async parse(): Promise<void>
    {
        try
        {
            const mimetype: string = (await this.readFile('mimetype')).trim().replace(/\n/, '');
            if (mimetype !== 'application/epub+zip')
            {
                throw new Error('MIME type is incorrect');
            }

            /**
             * Parse `META-INF/container.xml` and get path to the `.opf` file
             */
            await this.parseContainerXML();

            await this.loadOpfFile();
            
            await this.parseOpfFile();

        }
        catch (error)
        {
            console.error(`Failed to parse book: `, error);
        }
    }
    /**
     * Parses file `META-INF/container.xml`.
     * 
     * This file contains path to the `.opf` file
     */
    async parseContainerXML(): Promise<void>
    {
        try
        {
            const containerFile: string = await this.readFile(path.join('META-INF', 'container.xml'));
            if (!containerFile)
            {
                throw new Error('"container.xml" not found');
            }

            const parsedContainer: IContainerXMLSchema = (await parseXML(containerFile, false) as unknown) as IContainerXMLSchema;
            if (!parsedContainer)
            {
                throw new Error(`Failed to parse "container.xml"`);
            }

            this.optFilePath = parsedContainer.container.rootfiles[0].rootfile[0]["@_attr"]["full-path"];
        }
        catch (error)
        {
            console.error(error);
        }
    }
    async loadOpfFile(): Promise<void>
    {
        try
        {
            if (!this.optFilePath)
            {
                return;
            }

            const opfFileContent: string = await this.readFile(this.optFilePath);

            if (!opfFileContent)
            {
                throw new Error('".opf" file not found');
            }

            this.packageOpf = (await parseXML(opfFileContent, false) as unknown) as IOPFSchema; 

        }
        catch (error)
        {
            console.error(error);
        }
    }
    async parseOpfFile(): Promise<void>
    {
        try
        {
            if (!this.packageOpf)
            {
                throw new Error('Failed to parse the ".opf" file');
            }

            this.bookRef = new Book();

            await this.parseMetadata();

            
        }
        catch (error)
        {
            console.error(error);
        }
    }
    /**
     * Parses metadata from the `.opf` file and save it in the 'bookRef'
     */
    async parseMetadata(): Promise<void>
    {
        try
        {
            if (!this.packageOpf || !this.bookRef)
            {
                return;
            }

            const bookMetadata: IMetadataSchema = this.packageOpf.package.metadata[0];

            const bookTitleObject = bookMetadata['dc:title'][0];
            this.bookRef.title = typeof bookTitleObject === 'string' ? bookTitleObject : (bookTitleObject["@_text"] || '');

            console.log(`Book title is ${this.bookRef.title}`);

            const authorsDataList: Array<MetadataItem> | undefined = bookMetadata['dc:creator'];
            if (authorsDataList)
            {
                for (const author of authorsDataList)
                {
                    const authorName: string | undefined = typeof author === 'string' ? author : author["@_text"];
                    if (authorName)
                    {
                        this.bookRef.authors.push(authorName);
                    }
                }
            }

            console.log(`Authors: `, this.bookRef.authors);

            const languageData: Array<MetadataItem> | undefined = bookMetadata['dc:language'];

            if (languageData && languageData.length)
            {
                this.bookRef.title = typeof languageData[0] === 'string' ? languageData[0] : (languageData[0]["@_text"] || '');
            }

            console.log(`Book's language is ${this.bookRef.title}`);

            const publisherData: Array<MetadataItem> | undefined = bookMetadata['dc:publisher'];

            if (publisherData && publisherData.length)
            {
                this.bookRef.publisher = typeof publisherData[0] === 'string' ? publisherData[0] : (publisherData[0]["@_text"] || '');
            }

            console.log(`Book's publisher is ${this.bookRef.publisher}`);

        }
        catch (error)
        {
            console.error(error);
        }
    }
}