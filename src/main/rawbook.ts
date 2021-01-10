import AdmZip from "adm-zip";
import path from 'path';
import { IContainerXMLSchema, IMetadataSchema, IOPFSchema } from "./misc/schema";
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
            const mimetype: string = await this.readFile('mimetype');
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

            const bookMetadata: IMetadataSchema = this.packageOpf.package.metadata[0];

            const bookTitle = bookMetadata['dc:title'][0];

            console.log(`Book title is ${bookTitle}`);
        }
        catch (error)
        {
            console.error(error);
        }
    }
}