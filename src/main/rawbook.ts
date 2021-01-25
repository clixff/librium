import AdmZip from "adm-zip";
import fs, { promises as fsPromises } from "fs";
import path from 'path';
import { IBookChunk, IBookChunkNode } from "../shared/schema";
import { Book } from "./book";
import { IContainerXMLSchema, IManifestItem, IMetadataSchema, IOPFSchema, IReferenceSchema, ISpineSchema, IXMLNode, IXMLObject, MetadataItem } from "./misc/schema";
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
    currentHTMLFile = '';
    bookID = '';
    /**
     * Number of parsed symbols
     */
    parsedSymbols = 0;
    constructor(epubContent: Buffer, pathToSave: string, bookID: string)
    {
        this.zipArchive = new AdmZip(epubContent);
        this.pathToSave = pathToSave;
        this.bookID = bookID;
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

            this.bookRef = new Book(this.pathToSave, this.bookID);
            this.bookRef.updateLastTimeOpened();

            await this.parseMetadata();
            await this.parseManifest();

            await this.parseGuide();
            
            await this.parseSpine();

            console.log(`Reading order: \n`, this.readingOrder);

            await this.parsePages();


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
                     * Get path for the file, for example `../Documents/epub-reader/Books/8906f../content/EPUB/images/image.jpg`
                     */
                    const itemPathToSave = path.join(this.pathToSave, 'content', this.epubContentPath, manifestItem.href);
                    /**
                     * Directory path for the file, for example `../Documents/epub-reader/Books/8906f../content/EPUB/images/`
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
                        this.updateCover(manifestItem.href);
                    }
                }

                if (this.coverMetaID && this.coverMetaID === itemAttributes.id)
                {
                    if (this.bookRef)
                    {
                        this.updateCover(manifestItem.href);
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
                                this.updateCover(reference.href);
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
        return new Promise((resolve, reject) => 
        {
            const bookChunksDirectoryPath = path.join(this.pathToSave, 'chunks');
            fs.access(bookChunksDirectoryPath, fs.constants.F_OK, async (err) =>
            {
                try
                {
                    if (err)
                    {
                        await fsPromises.mkdir(bookChunksDirectoryPath, { recursive: true });
                    }
                    
                    let chunkID = 0;
                    for (const filePath of this.readingOrder)
                    {
                        const relativeFilePath = path.join(this.epubContentPath, filePath);
                        console.log(`File path is "${relativeFilePath}"`);
                        this.currentHTMLFile = relativeFilePath;
                        const fileContent: string = await this.readFile(relativeFilePath);
                        if (!fileContent)
                        {
                            console.log(`File "${relativeFilePath}" not found in archive`);
                        }
                        else
                        {
                            const xmlParsed: IXMLObject = await parseXML(fileContent, true);
                            console.log('Parsed XML: ', xmlParsed);
                            const convertedChunk: IBookChunk | null = await this.convertXMLToBookChunk(xmlParsed);
                            if (convertedChunk)
                            {
                                if (this.bookRef)
                                {
                                    this.bookRef.chunks.push(convertedChunk);
                                }
                                const bookChunkToSave: string = JSON.stringify(convertedChunk);
                                await fsPromises.writeFile(path.join(bookChunksDirectoryPath, `${chunkID}.json`), bookChunkToSave, { encoding: 'utf-8' });
                                chunkID++;
                            }
                        }
                    }
                    
                    if (this.bookRef)
                    {
                        this.bookRef.symbols = this.parsedSymbols;
                    }

                    resolve();
                }
                catch (error)
                {
                    console.error(error);
                    reject(error);
                }

            });
        });
    }
    async convertXMLToBookChunk(xmlObject: IXMLObject): Promise<IBookChunk | null>
    {
        try
        {
            const htmlNode: IXMLNode | undefined = xmlObject['html'];
            if (!htmlNode || !htmlNode["@_children"] || !htmlNode["@_children"].length)
            {
                return null;
            }

            let bodyNode: IXMLNode | undefined = undefined;

            for (const htmlChild of htmlNode["@_children"])
            {
                if (htmlChild["#name"] === 'body')
                {
                    bodyNode = htmlChild;
                }
            }
        
            if (!bodyNode)
            {
                return null;
            }

            const convertedBodyNode: IBookChunkNode | null = await this.convertXMLNodeToBookChunkNode(bodyNode);

            if (!convertedBodyNode)
            {
                return null;
            }

            const bookChunk: IBookChunk = {
                body: convertedBodyNode
            };

            return bookChunk;
        }
        catch (error)
        {
            console.error(error);
        }
    
        return null;
    }
    async convertXMLNodeToBookChunkNode(xmlNode: IXMLNode): Promise<IBookChunkNode | null>
    {
        try
        {
            const bookChunkNode: IBookChunkNode = {
                name: xmlNode["#name"]
            };

            if (xmlNode["@_text"])
            {
                bookChunkNode.text = xmlNode["@_text"];
                this.parsedSymbols = (bookChunkNode.text || '').length;
            }

            if (xmlNode["@_attr"])
            {
                /**
                 * TODO: Rewrite this to `for (let ...)`
                 */
                bookChunkNode.attr = {};
                for (const attrName in xmlNode['@_attr'])
                {
                    const xmlAttr = xmlNode['@_attr'][attrName];
                    if (typeof xmlAttr === 'string')
                    {
                        bookChunkNode.attr[attrName] = xmlAttr;
                    }
                }
            }
        
            /**
             * Convert media relative paths to the local server URL 
             */

            const attributesList = bookChunkNode.attr;
            if (attributesList)
            {
                switch (bookChunkNode.name)
                {
                    case 'img':
                    case 'video':
                    case 'track':
                    case 'audio':
                        this.fixNodeAttributeRelativePath(attributesList, 'src');
                        break;
                    case 'image':
                        this.fixNodeAttributeRelativePath(attributesList, 'xlink:href');
                        break;
                    case 'source':
                        this.fixNodeAttributeRelativePath(attributesList, 'srcset');
                        this.fixNodeAttributeRelativePath(attributesList, 'src');
                        break;
                    case 'video':
                        break;
                    default:
                        break;
                }
            }


            if (xmlNode["@_children"])
            {
                for (let i = 0; i < xmlNode["@_children"].length; i++)
                {
                    const xmlNodeChild: IXMLNode = xmlNode["@_children"][i];
                    const bookChunkNodeChild: IBookChunkNode | null = await this.convertXMLNodeToBookChunkNode(xmlNodeChild);

                    if (bookChunkNodeChild)
                    {
                        if (!bookChunkNode.children)
                        {
                            bookChunkNode.children = [];
                        }

                        bookChunkNode.children.push(bookChunkNodeChild);
                    }
                }
            }

            return bookChunkNode;
        }
        catch (error)
        {
            console.error(error);
        }

        return null;
    }
    /**
     * Converts file path in format `./media/image.src` to the 'http://127.0.0.1:45506/file/8906ffe8.../media%5Cimage.src'
     */
    convertRelativePathToHTTP(filePath: string, htmlPath: string): string
    {
        if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:'))
        {
            return filePath;
        }

        const httpServerPort = 45506;
        const convertedFilePathComponent = this.convertRelativePathToHTTPComponent(filePath, htmlPath);
        return `http://127.0.0.1:${httpServerPort}/file/${convertedFilePathComponent}`;
    }
    convertRelativePathToHTTPComponent(filePath: string, htmlPath: string): string
    {
        const htmlParsedPath: path.ParsedPath = path.parse(htmlPath);
        const htmlDirPath: string = htmlParsedPath.dir;
        const finalRelativePath = path.join(htmlDirPath, filePath);
        return `${this.bookID}/${encodeURIComponent(finalRelativePath)}`;
    }
    fixNodeAttributeRelativePath(attributesList: Record<string, string>, attributeName: string): void
    {
        if (attributesList[attributeName])
        {
            attributesList[attributeName] = this.convertRelativePathToHTTP(attributesList[attributeName], this.currentHTMLFile);
        }
    }
    updateCover(coverPath: string): void
    {
        if (!this.bookRef)
        {
            return;
        }

        const fullCoverPath = path.join(this.epubContentPath, coverPath);

        this.bookRef.cover = this.convertRelativePathToHTTPComponent(fullCoverPath, this.currentHTMLFile);
        /**
         * Remove prefix with book ID
         */
        this.bookRef.cover = this.bookRef.cover.slice(41);
    }
}