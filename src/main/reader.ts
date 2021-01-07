import { ipcMain, dialog, BrowserWindow, app } from "electron";
import fs, { promises as fsPromises, readFile } from 'fs';
import crypto from 'crypto';
import path from 'path';
import AdmZip from 'adm-zip';
import { getConfig } from "./config";
import xml2js from 'xml2js';

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
 * Opens .epub file, checks file signature, then converts it to the right format and open in GUI
 */
async function openFile(filePath: string): Promise<void>
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

            const bookToOpenDirectoryPath: string = path.resolve(booksDirectoryPath, fileCheckSum);

            fs.access(bookToOpenDirectoryPath, fs.constants.F_OK, async (err) =>
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
                    await fsPromises.mkdir(bookToOpenDirectoryPath, { recursive: true }); 
                    await convertBook(bookToOpenDirectoryPath, fileContent);
                }
            });
        });
    }
    catch (error)
    {
        console.error(error);
    }
}

/**
 * Unzip a .epub book, converts it to a custom format, then saves book data to disk
 */
async function convertBook(bookDirectory: string, epubContent: Buffer): Promise<void>
{
    try
    {
        const bookUnziped = new AdmZip(epubContent);
        const mimetype = await readFileInArchive(bookUnziped, 'mimetype');
        if (mimetype !== 'application/epub+zip')
        {
            throw new Error('MIME type is incorrect');
        }

        /**
         * Open the file `container.xml`, that contains path to the `.opf` file
         */
        const containerFile = await readFileInArchive(bookUnziped, path.join('META-INF', 'container.xml'));
        console.log('Container file is ', containerFile);
        if (!containerFile)
        {
            throw new Error('Container.xml not found');
        }

        const parser = new xml2js.Parser();

        // xml2js.parseStringPromise(containerFile, {  })

        const parsedContainer: Record<string, unknown> = await parser.parseStringPromise(containerFile);


        // console.log(parsedContainer);

        // for (const key in parsedContainer)
        // {
        //     console.log(parsedContainer[key]);
        // }

        // const packageFile = await readFileInArchive();
    }
    catch (error)
    {
        console.error(error);
    }
}


function readFileInArchive(archive: AdmZip, filePath: string, encoding = 'utf8'): Promise<string>
{
    /**
     * Replace double backslashes with frontslashes
     */
    filePath = filePath.replace(/\\/g, '/');
    return new Promise((resolve) =>
    {
        archive.readAsTextAsync(filePath, (data) => 
        {
            resolve(data);
        }, encoding);
    });
}

/**
 * Shows book in the GUI
 */
function showBook(): void
{
    showBook();
}



interface IXMLNode
{
    /** List of atributes */
    "@_attr"?: Record<string, unknown>;
    /** Inner text of this tag */
    "@_text"?: string;
    /** Name of this tag */
    "#name": string; 
    /** Children nodes */
    "@_children"?: Array<IXMLNode>;
}

/**
 * XML document in object
 */
interface IXMLObject
{
    [tag: string]: IXMLNode;
}


async function parseXML(xmlContent: string): Promise<IXMLObject>
{
    try
    {
        const xmlParserParams = {
            explicitChildren: true,
            preserveChildrenOrder: true,
            childkey: '@_children',
            attrkey: '@_attr',
            charkey: '@_text'
        };
    
        const xmlObject: IXMLObject = await xml2js.parseStringPromise(xmlContent, xmlParserParams);

        
        await fixXMLObject(xmlObject);

        return xmlObject;
    }
    catch (err)
    {
        console.error(err);
    }

    return {};
}

/**
 * Removes dublicate keys from the XML object
 */
async function fixXMLObject(xmlObject: IXMLObject): Promise<void>
{
    try
    {
        if (!xmlObject)
        {
            return;
        }

        const objectKeys = Object.keys(xmlObject);
        if (!objectKeys.length)
        {
            return;
        }

        const xmlRootNode: string = objectKeys[0];

        fixXMLNode(xmlObject[xmlRootNode]);
    }
    catch (error)
    {
        console.error(error);
    }
}


/**
 * Removes dublicate keys from the XML node
 */
function fixXMLNode(xmlNode: IXMLNode): void
{
    try
    {
        if (!xmlNode || typeof xmlNode !== 'object')
        {
            return;
        }

        const xmlNodeAsObject: Record<string, unknown> = (xmlNode as unknown) as Record<string, unknown>;

        for (const key in xmlNodeAsObject)
        {
            if (key === '@_children')
            {
                const childrenList: Array<IXMLNode> = xmlNode["@_children"] as Array<IXMLNode>;

                for (const childXmlNode of childrenList)
                {
                    fixXMLNode(childXmlNode);
                }
            }
            else if (key !== '@_attr' && key !== '@_text' && key !== '#name')
            {
                /**
                 * Remove key from the parsed XML node, if it's not a attributes list, inner text, children list or tag name.
                 */
                delete xmlNodeAsObject[key];
            }
        }
    }
    catch(err)
    {
        console.error(err);
    }
}