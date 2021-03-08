import {IMetadataSchema, IXMLNode, IXMLObject, MetadataItem } from "./misc/schema";
import xml2js from 'xml2js';
import { HTMLElement, TextNode, NodeType } from 'node-html-parser';
import { IBookChunkNode } from "../shared/schema";
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

let bLogged = false;

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
                        const fullPath = path.join(path.parse(rawBook.currentHTMLFile).dir, linkHref);
                        const parsedLink = fullPath.match(/([^#]+)(?:#(.+)?)?$/);
                        const linkFilePath = parsedLink ? parsedLink[1] : '';
                        const linkAnchor = parsedLink ? parsedLink[2] : '';
                        const filePathFixed = linkFilePath.toLowerCase().replace(/\\/g, '/');
                        if (!bLogged)
                        {
                            console.log(`[link] Link path ${filePathFixed}`);
                        }

                        for (let i = 0; i < rawBook.readingOrder.length; i++)
                        {
                            const bookItem = path.join(rawBook.epubContentPath, rawBook.readingOrder[i]).toLowerCase().replace(/\\/g, '/');
                            if (!bLogged)
                            {
                                console.log(`[link] compare link with ${bookItem}`);
                            }
                            if (bookItem === filePathFixed)
                            {
                                if (!bLogged)
                                {
                                    console.log(`[link] found equal file`);
                                }
                                attributesList['generated-link-chunk'] = `${i}`;

                                if (linkAnchor)
                                {
                                    attributesList['generated-link-id'] = `${linkAnchor}`;
                                }

                                delete attributesList['href'];

                                break;
                            }
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
            for (let i = 0; i < htmlNode.childNodes.length; i++)
            {
                const childNode = htmlNode.childNodes[i];
                if (childNode)
                {
                    if (childNode.nodeType === NodeType.TEXT_NODE)
                    {
                        const textNode = childNode as TextNode;

                        if (textNode.isWhitespace && (i === 0 || i === (htmlNode.childNodes.length - 1)))
                        {
                            continue;
                        }

                        if (!bookChunkNode.children)
                        {
                            bookChunkNode.children = [];
                        }

                        bookChunkNode.children.push(Html5Entities.decode(textNode.text));
                    }
                    else if (childNode.nodeType ===  NodeType.ELEMENT_NODE)
                    {
                        const nodeElement = childNode as HTMLElement;
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