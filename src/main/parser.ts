import {IMetadataSchema, IXMLNode, IXMLObject, MetadataItem } from "./misc/schema";
import xml2js from 'xml2js';
import { HTMLElement, TextNode, NodeType } from 'node-html-parser';
import { IBookChunkNode } from "../shared/schema";
import { RawBook } from "./rawbook";

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
                         break;
                     case 'source':
                        rawBook.fixNodeAttributeRelativePath(attributesList, 'srcset');
                        rawBook.fixNodeAttributeRelativePath(attributesList, 'src');
                         break;
                     default:
                         break;
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
                        if (!textNode.isWhitespace)
                        {
                            if (!bookChunkNode.children)
                            {
                                bookChunkNode.children = [];
                            }

                            bookChunkNode.children.push(textNode.textContent);
                        }
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