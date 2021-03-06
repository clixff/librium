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

    children?: Array<IBookChunkNode | string> 
}

export interface IBookChunk
{
    body: IBookChunkNode
}