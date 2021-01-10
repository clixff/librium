import { IContainerXMLSchema, IMetadataSchema, IOPFSchema, IXMLNode, IXMLObject } from "./misc/schema";
import xml2js from 'xml2js';

/**
 * 
 * @param xmlContent 
 * @param bShouldFixXML The order of the child nodes will be preserved. `False` should be used with known XML schemas
 */
export async function parseXML(xmlContent: string, bShouldFixXML = true): Promise<IXMLObject>
{
    try
    {
        const xmlParserParams: xml2js.ParserOptions = {
            explicitChildren: bShouldFixXML,
            preserveChildrenOrder: bShouldFixXML,
            childkey: '@_children',
            attrkey: '@_attr',
            charkey: '@_text',
            trim: true
        };
    
        const xmlObject: IXMLObject = await xml2js.parseStringPromise(xmlContent, xmlParserParams);

        if (bShouldFixXML)
        {
            await fixXMLObject(xmlObject);
        }

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

/**
 * Parses `META-INF/container.xml` file and gets path to the `.opf` file
 */
export async function getOpfFilePath(fileContent: string): Promise<string>
{

    try
    {
        const parsedContainer: IContainerXMLSchema = (await parseXML(fileContent, false) as unknown) as IContainerXMLSchema;

        /**
         * Path to the file with book structure (`Open Packaging Format` file)
         */
        const opfFilePath: string = parsedContainer.container.rootfiles[0].rootfile[0]["@_attr"]["full-path"];

        return opfFilePath;
    }
    catch (error)
    {
        console.error(error);
    }

    return '';
}

export async function parseOpfFile(fileContent: string): Promise<void>
{
    try
    {
        const parsedFile: IOPFSchema = (await parseXML(fileContent, false) as unknown) as IOPFSchema;
        if (!parsedFile)
        {
            throw new Error('Failed to parse .opf file');
        }

        const bookMetadata: IMetadataSchema = parsedFile.package.metadata[0];

        const bookTitle = bookMetadata['dc:title'][0];
        
        console.log(`Book title is ${bookTitle}`);

    }
    catch(error)
    {
        console.error(error);
    }
}

