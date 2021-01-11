export interface IXMLNode
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
export interface IXMLObject
{
    [tag: string]: IXMLNode;
}


/**
 * XML schema of file `META-INF/container.xml`
 */
export interface IContainerXMLSchema
{
    container: {
        rootfiles: [
            {
                rootfile: [
                    {
                        '@_attr': {
                            'full-path': string,
                            'media-type': 'application/oebps-package+xml'
                        }
                    }
                ]
            }
        ]
    };
}


export interface IMetadataItem
{
    "@_text"?: string;
    "@_attr"?: Record<string, string>;
}

/**
 * Schema of the `metadata items`
 * 
 * `Metadata items` are listed in the `metadata` element of the `.opf` file
 */
export type MetadataItem = IMetadataItem | string;

/**
 * Schema of the `metadata` element
 * 
 * `Metadata` element is stored in the `.opf` file
 */
export interface IMetadataSchema 
{
    [element: string]: Array<MetadataItem>;
}

/**
 * Schema of the 'itemref' element
 * 
 * `Itemref` elements are listed in the `spine` element of the `.opf` file
 */
export interface IItemRefSchema
{
    idref: string;
    linear?: string;
}

/**
 * Schema of the `spine` element
 * 
 * `Spine` is stored in the `.opf` file
 */
export interface ISpineSchema
{
    "@_attr"?: 
    {
        toc?: string;
    },
    itemref: Array<IItemRefSchema>;
}

/**
 * Schema of the `item` elements.
 * 
 * `Item` elements are listed in the `manifest` element of the `.opf` file
 */
export interface IManifestItemSchema
{
    "@_attr": {
        "id": string;
        "media-type": string;
        "href": string;
        "properties"?: string;
    }
}

/**
 * Schema of the `reference` element
 * 
 * `Reference` elements are listed in the `guide` element of the `.opf` file
 */
export interface IReferenceSchema
{
    href: string;
    title: string;
    type: string;
}

/**
 * Schema of the `.opf` file
 */
export interface IOPFSchema
{
    package: {
        metadata?: [
            IMetadataSchema
        ],
        "opf:metadata"? : [
            IMetadataSchema
        ];
        manifest: [
            {
                item: Array<IManifestItemSchema>
            }
        ],
        spine: [
            ISpineSchema
        ],
        guide?: [
            Record<string, Array<IReferenceSchema>>
        ]
    }
}

export interface IManifestItem
{
    "media-type": string;
    "href": string;
    "properties"?: string;
}