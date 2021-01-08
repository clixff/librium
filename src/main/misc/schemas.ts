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

/**
 * Schema of the .opf file
 */
export interface IOPFSchema
{

}