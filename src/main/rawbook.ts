import AdmZip from "adm-zip";
import fs, { promises as fsPromises } from "fs";
import path from 'path';
import { Book } from "./book";
import { IContainerXMLSchema, IManifestItem, IMetadataSchema, IOPFSchema, IReferenceSchema, ISpineSchema, MetadataItem } from "./misc/schema";
import { getAllMetadataItemStrings, getFirstMetadataItemString, parseXML } from "./parser";

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

    items = new Map<string, IManifestItem>();

    /**
     * Directory path in archive to the book content
     */
    epubContentPath = '';
    /**
     * If the book has a metadata element `cover`, then use it for cover image.
     */
    coverMetaID = '';

    /**
     * Array with HTML file names
     */
    readingOrder: Array<string> = [];
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

            if (this.bookRef)
            {
                await this.bookRef.saveMeta();
            }
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
            const parseArchivePath: path.ParsedPath = path.parse(this.optFilePath);

            if (parseArchivePath)
            {
                this.epubContentPath = parseArchivePath.dir;
            }
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

            this.bookRef = new Book(this.pathToSave);

            await this.parseMetadata();
            await this.parseManifest();

            await this.parseGuide();
            
            await this.parseSpine();

            await this.parsePages();

            console.log(`Reading order: \n`, this.readingOrder);

            /**
             * TODO: Parse toc.ncx
             */
            
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

            const packageObject = this.packageOpf.package;

            const bookMetadataArray = packageObject.metadata ? packageObject.metadata : packageObject['opf:metadata'];

            if (!bookMetadataArray || !bookMetadataArray.length)
            {
                throw new Error('Book metadata not found');
            }
            const bookMetadata: IMetadataSchema = bookMetadataArray[0];

            /**
             * Parse book title
             */
            this.bookRef.title = getFirstMetadataItemString(bookMetadata, 'dc:title');
            console.log(`Book title is ${this.bookRef.title}`);

            /**
             * Parse array of book authors
             */
            this.bookRef.authors = getAllMetadataItemStrings(bookMetadata, 'dc:creator');
            console.log(`Authors: `, this.bookRef.authors);

            /**
             * Parse book language
             */
            this.bookRef.language = getFirstMetadataItemString(bookMetadata, 'dc:language');
            console.log(`Book language is ${this.bookRef.title}`);
            
            /**
             * Parse book publisher
             */
            this.bookRef.publisher = getFirstMetadataItemString(bookMetadata, 'dc:publisher');
            console.log(`Book's publisher is ${this.bookRef.publisher}`);


            const metaElements: Array<MetadataItem> | undefined = bookMetadata.meta;
            if (metaElements && metaElements.length)
            {
                for (const metaElement of metaElements)
                {
                    if (typeof metaElement === 'object')
                    {
                        const metaAtributes = metaElement["@_attr"];
                        if (metaAtributes)
                        {
                            if (metaAtributes['name'] === 'cover')
                            {
                                this.coverMetaID = metaAtributes['content'];
                            }
                        }
                    }
                }
            }

        }
        catch (error)
        {
            console.error(error);
        }
    }
    /**
     * Parses `item` elements from the `manifest` and saves them in the `items` Map.
     */
    async parseManifest(): Promise<void>
    {
        try
        {
            if (!this.packageOpf)
            {
                return;
            }

            const bookManifest = this.packageOpf.package.manifest[0];
            for (const item of bookManifest.item)
            {
                const itemAttributes = item['@_attr'];
                const manifestItem: IManifestItem = {
                    'media-type': itemAttributes['media-type'],
                    'href': itemAttributes.href 
                };
                if (itemAttributes.properties)
                {
                    manifestItem.properties = itemAttributes.properties;
                }

                /**
                 * Extract files such as images and fonts to disk
                 */
                if (manifestItem["media-type"] !== 'application/xhtml+xml' && manifestItem["media-type"] !== 'application/x-dtbncx+xml')
                {
                    /**
                     * Get path in the archive, for example `EPUB/images/image.jpg`
                     */
                    const itemPathInArchive = path.join(this.epubContentPath, manifestItem.href).replace(/\\/g, '/');
                    /**
                     * Get path for the file, for example `../Documents/epub-reader/Books/8906f../content/misc/images/image.jpg`
                     */
                    const itemPathToSave = path.join(this.pathToSave, 'content', 'misc', manifestItem.href);
                    /**
                     * Directory path for the file, for example `../Documents/epub-reader/Books/8906f../content/misc/images`
                     */
                    const directoryToSaveFile = path.parse(itemPathToSave).dir;
                    fs.access(directoryToSaveFile, fs.constants.F_OK, async (err) =>
                    {
                        try
                        {
                            if (err)
                            {
                                await fsPromises.mkdir(directoryToSaveFile, { recursive: true });
                            }
    
                            this.zipArchive.extractEntryTo(itemPathInArchive, directoryToSaveFile, false, true);
                        }
                        catch (error)
                        {
                            console.error(error);
                        }
                    });
                }

                if (manifestItem.properties === 'cover-image')
                {
                    if (this.bookRef)
                    {
                        this.bookRef.cover = manifestItem.href;
                    }
                }

                if (this.coverMetaID && this.coverMetaID === itemAttributes.id)
                {
                    if (this.bookRef)
                    {
                        this.bookRef.cover = manifestItem.href;
                    }
                }

                this.items.set(itemAttributes.id, manifestItem);
            }
        }
        catch (error)
        {
            console.error(error);
        }
    }
    async parseSpine(): Promise<void>
    {
        try
        {
            if (!this.packageOpf)
            {
                return;
            }
            const spineElement: ISpineSchema = this.packageOpf.package.spine[0];

            if (spineElement && spineElement.itemref && spineElement.itemref.length)
            {
                for (const itemRef of spineElement.itemref)
                {
                    if (!itemRef["@_attr"])
                    {
                        continue;
                    }
                    const itemRefId = itemRef["@_attr"].idref;
                    // console.log(`Item ref id is `, itemRefId);
                    if (this.items.has(itemRefId))
                    {
                        const manifestItem: IManifestItem | undefined = this.items.get(itemRefId);

                        if (manifestItem)
                        {
                            this.readingOrder.push(manifestItem.href);
                        }
                    }
                }
            }
        }
        catch (error)
        {
            console.error(error);
        }
    }
    async parseGuide(): Promise<void>
    {
        try
        {
            if (!this.packageOpf)
            {
                return;
            }

            const guideElementArray = this.packageOpf.package.guide;
            if (guideElementArray)
            {
                const guideElement = guideElementArray[0];
                const referencesList: Array<IReferenceSchema> | undefined = guideElement.reference;
                if (referencesList)
                {
                    for (const reference of referencesList)
                    {
                        if (reference.type === 'cover')
                        {
                            if (this.bookRef)
                            {
                                this.bookRef.cover = reference.href;
                            }
                        }
                    }
                }
            }
        }
        catch (error)
        {
            console.error(error);
        }
    }
    parsePages(): Promise<void>
    {
        return new Promise((resolve) => 
        {
            const bookChunksDirectoryPath = path.join(this.pathToSave, 'content', 'chunks');
            fs.access(bookChunksDirectoryPath, fs.constants.F_OK, async (err) => 
            {
                try
                {
                    if (err)
                    {
                        await fsPromises.mkdir(bookChunksDirectoryPath, { recursive: true });
                    }

                    for (const filePath of this.readingOrder)
                    {
                        
                    }

                    resolve();
                }
                catch (error)
                {
                    console.error(error);
                }

            });
        });
    }
}