import {IMetadataSchema, ITOCNavPoint, IXMLNode, IXMLObject, MetadataItem } from "./misc/schema";
import xml2js from 'xml2js';
import { HTMLElement, TextNode, NodeType, parse as parseHTML } from 'node-html-parser';
import { IBookChunkNode, ITOC } from "../shared/schema";
import { RawBook } from "./rawbook";
import { Html5Entities } from 'html-entities';
import path from 'path';

export const bookStyles = {
    container: `.book_container____`
};


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

function getMetadataItemString(item: MetadataItem): string
{
    return (typeof item === 'string' ? item : (item["@_text"] || '') );
}

export function getFirstMetadataItemString(metadataObject: IMetadataSchema, key: string): string
{
    let outString = '';

    const metadataItems: Array<MetadataItem> | undefined = metadataObject[key];

    if (metadataItems && metadataItems.length)
    {
        const firstMetadataItem = metadataItems[0];
        outString = getMetadataItemString(firstMetadataItem);
    }

    return outString;
}

export function getAllMetadataItemStrings(metadataObject: IMetadataSchema, key: string): Array<string>
{
    const outArray: Array<string> = [];

    const metadataItems: Array<MetadataItem> | undefined = metadataObject[key];

    if (metadataItems && metadataItems.length)
    {
        for (const metadataitem of metadataItems)
        {
            outArray.push(getMetadataItemString(metadataitem));
        }
    }

    return outArray;
}

let bLogged = true;

export function htmlNodeToBookNode(htmlNode: HTMLElement, rawBook: RawBook): IBookChunkNode | null
{
    try
    {
        const bookChunkNode: IBookChunkNode = {
            name: htmlNode.rawTagName
        };

        if (htmlNode.attributes)
        {
            bookChunkNode.attr = htmlNode.attributes;

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
                        rawBook.fixNodeAttributeRelativePath(attributesList, 'src');
                        break;
                    case 'image':
                    rawBook.fixNodeAttributeRelativePath(attributesList, 'xlink:href');
                    rawBook.fixNodeAttributeRelativePath(attributesList, 'href');
                        break;
                    case 'source':
                    rawBook.fixNodeAttributeRelativePath(attributesList, 'srcset');
                    rawBook.fixNodeAttributeRelativePath(attributesList, 'src');
                        break;
                    default:
                        break;
                }

                /**
                 * Fix relative link to page
                 */
                if (htmlNode.rawTagName === 'a' && attributesList['href'])
                {
                    const linkHref = attributesList['href'];
                    if (!linkHref.startsWith('#') && !linkHref.startsWith('http://') && !linkHref.startsWith('https://'))
                    {
                        const fullPath = path.join(path.parse(rawBook.currentHTMLFile).dir, linkHref).toLowerCase().replace(/\\/g, '/');
                        const [chunkID, linkAnchor] = parseChunkIDAndAnchor(fullPath, rawBook.readingOrderMap);

                        if (chunkID !== -1)
                        {
                            attributesList['generated-link-chunk'] = `${chunkID}`;

                            if (linkAnchor)
                            {
                                attributesList['generated-link-id'] = `${linkAnchor}`;
                            }

                            delete attributesList['href'];
                        }
                    }
                    else if (linkHref.startsWith('#'))
                    {
                        attributesList['generated-link-id'] = linkHref.slice(1);
                        delete attributesList['href'];
                    }

                    if (!bLogged)
                    {
                        bLogged = true;
                    }
                }
            }
        }

        if (htmlNode.childNodes)
        {
            const bIsTableChild = ['table', 'tbody', 'thead', 'th', 'tr', 'td'].includes(bookChunkNode.name);

            for (let i = 0; i < htmlNode.childNodes.length; i++)
            {
                const childNode = htmlNode.childNodes[i];
                const bIsLastChild = i === (htmlNode.childNodes.length - 1);
                if (childNode)
                {
                    if (childNode.nodeType === NodeType.TEXT_NODE)
                    {
                        const textNode = childNode as TextNode;

                        /**
                         * Do not add a whitespace child if it's inside a table element, first or last child
                         */
                        if (textNode.isWhitespace && (bIsTableChild || (i === 0 || bIsLastChild)))
                        {
                            continue;
                        }

                        if (!bookChunkNode.children)
                        {
                            bookChunkNode.children = [];
                        }

                        bookChunkNode.children.push(Html5Entities.decode(textNode.text));
                    }
                    else if (childNode.nodeType === NodeType.ELEMENT_NODE)
                    {
                        const nodeElement = childNode as HTMLElement;

                        if (nodeElement.rawTagName === 'script')
                        {
                            continue;
                        }

                        const childBookNode = htmlNodeToBookNode(nodeElement, rawBook);
                        if (childBookNode)
                        {
                            if (!bookChunkNode.children)
                            {
                                bookChunkNode.children = [];
                            }

                            bookChunkNode.children.push(childBookNode);
                        }
                    }
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


function parseChunkIDAndAnchor(filePath: string, readingOrderMap: Map<string, number>): [number, string]
{
    let chunkID = -1;
    let anchor = '';

    const parsedPath = filePath.match(/([^#]+)(?:#(.+)?)?$/);
    const filePathElement = parsedPath ? parsedPath[1] || '' : '';
    const fullFilePath = filePathElement.toLowerCase().replace(/\\/g, '/');

    anchor = parsedPath ? parsedPath[2] || '' : '';

    const chuknIDInMap = readingOrderMap.get(fullFilePath);
    
    if (chuknIDInMap !== undefined && isFinite(chuknIDInMap))
    {
        chunkID = chuknIDInMap;
    }
    

    return [chunkID, anchor];
}


function parseTOCNavPoint(navPoint: ITOCNavPoint, tocPath: string, readingOrder: Map<string, number>): ITOC | null
{
    if (navPoint && navPoint["#name"] === 'navPoint' && navPoint["@_children"])
    {
        const tocItem: ITOC = {
            name: '',
            chunk: -1,
            anchor: ''
        };
        for (let i = 0; i < navPoint["@_children"].length; i++)
        {
            const navPointChild = navPoint["@_children"][i];
            if (navPointChild)
            {
                switch (navPointChild["#name"]) 
                {
                    case 'content':
                        if (!navPointChild["@_attr"] || !navPointChild["@_attr"].src)
                        {
                            return null;
                        }

                        const tocItemPath = path.join(tocPath, navPointChild["@_attr"].src);

                        const [chuknID, anchor] = parseChunkIDAndAnchor(tocItemPath, readingOrder);

                        tocItem.chunk = chuknID;
                        tocItem.anchor = anchor;


                        break;
                    case 'navLabel':
                        const navLabel = navPointChild;
                        
                        if (!navLabel["@_children"] || !navLabel["@_children"].length)
                        {
                            return null;
                        }

                        const navLabelTextElement = navLabel["@_children"][0];
                        if (navLabelTextElement && navLabelTextElement["#name"] === 'text' && navLabelTextElement["@_text"] !== undefined)
                        {
                            tocItem.name = navLabelTextElement["@_text"];   
                        }

                        break;
                    case 'navPoint':
                        const childPoint: ITOC | null = parseTOCNavPoint(navPointChild, tocPath, readingOrder);
                        if (childPoint)
                        {
                            if (!tocItem.children)
                            {
                                tocItem.children = [];
                            }

                            tocItem.children.push(childPoint);
                        }
                        break;
                }
            }
        }
        
        if (tocItem && tocItem.chunk !== -1)
        {
            return tocItem;
        }
    }

    return null;
}

export function parseTOCNavPoints(navPoints: Array<ITOCNavPoint>, tocPath: string, readingOrder: Map<string, number>): Array<ITOC>
{
    const tableOfContents: Array<ITOC> = [];

    tocPath = path.parse(tocPath).dir;

    if (navPoints && navPoints.length)
    {
        for (let i = 0; i < navPoints.length; i++)
        {
            const navPoint = navPoints[i];

            const tocItem: ITOC | null = parseTOCNavPoint(navPoint, tocPath, readingOrder);
            if (tocItem)
            {
                tableOfContents.push(tocItem);
            }
        }
    }

    return tableOfContents;
}

function parseHtmlTocLiElement(liElement: HTMLElement, tocDirectory: string, arrayToAdd: Array<ITOC>, readingOrderMap: Map<string, number>): void
{
    if (!liElement)
    {
        return;
    }

    /**
     * Is added to the array
     */
    let bIsNavPoint = false;
    
    const tocItem: ITOC = {
        name: '',
        chunk: -1,
        anchor: '',
    };

    let olElement: HTMLElement | null = null;

    for (let i = 0; i < liElement.childNodes.length; i++)
    {
        const childNode = liElement.childNodes[i];
        if (childNode.nodeType === NodeType.ELEMENT_NODE)
        {
            const childNodeElement = childNode as HTMLElement;

            if (childNodeElement.rawTagName === 'a')
            {
                tocItem.name = (childNodeElement.text || '').trim();
                if (childNodeElement.attributes.href)
                {
                    const [chunkID, anchor] = parseChunkIDAndAnchor(path.join(tocDirectory, childNodeElement.attributes.href), readingOrderMap);

                    tocItem.chunk = chunkID;
                    tocItem.anchor = anchor;

                    if (chunkID !== -1)
                    {
                        bIsNavPoint = true;
                        arrayToAdd.push(tocItem);
                    }
                }
            }
            else if (childNodeElement.rawTagName === 'ol')
            {
                olElement = childNodeElement;
            }
        }
    }

    
    if (olElement)
    {
        if (bIsNavPoint)
        {
            tocItem.children = [];
            parseHtmlTocNavPoints(olElement, tocDirectory, tocItem.children, readingOrderMap);
        }
        else
        {
            parseHtmlTocNavPoints(olElement, tocDirectory, arrayToAdd, readingOrderMap);
        }
    }
}

function parseHtmlTocNavPoints(olElement: HTMLElement, tocDirectory: string, arrayToAdd: Array<ITOC>, readingOrderMap: Map<string, number>): void
{
    if (!olElement)
    {
        return;
    }

    for (let i = 0; i < olElement.childNodes.length; i++)
    {
        const childElement = olElement.childNodes[i];
        if (childElement.nodeType === NodeType.ELEMENT_NODE)
        {
            const liElement = childElement as HTMLElement;
            
            parseHtmlTocLiElement(liElement, tocDirectory, arrayToAdd, readingOrderMap);
        }
    }
}

/**
 * Parses EPUB 3.0 navigation HTML file (instead of old toc.ncx)
 */
export function parseHtmlTocFile(fileContent: string, tocPath: string, readingOrderMap: Map<string, number>): Array<ITOC>
{
    const tableOfContents: Array<ITOC> = [];

    const rootNode = parseHTML(fileContent, { blockTextElements: {} });

    const tocDirectory = path.parse(tocPath).dir;

    if (rootNode)
    {
        const navWrapper = rootNode.querySelector('nav[type="toc"] > ol');

        if (navWrapper)
        {
            parseHtmlTocNavPoints(navWrapper, tocDirectory, tableOfContents, readingOrderMap);
        }
    }

    return tableOfContents;
}