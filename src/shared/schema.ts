export interface IBookChunkNode
{
    /**
     * Name of HTML tag
     */
    name: string;
    /**
     * List of HTML attributes
     */
    attr?: Record<string, string>;
    /**
     * Inner text of HTML element
     */
    text?: string;

    children?: Array<IBookChunkNode | string> 
}

export interface IBookChunk
{
    body: IBookChunkNode
}