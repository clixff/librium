import React, { Component } from 'react';
import { IBookChunk, IBookChunkNode } from '../../../shared/schema';
import { IBook } from '../../misc/book';
import bookStyles from '../../styles/modules/book.module.css';

interface IBookChunkProps
{
    id: number;
    chunk: IBookChunk;
}

function getBookChunkNodeJSX(BookChunkNode: IBookChunkNode): JSX.Element
{
    let props = BookChunkNode.attr as Record<string, unknown>;
    if (!props)
    {
        props = {};
    }

    /**
     * TODO: Fix the style prop
     */
    delete props['style'];
    if (BookChunkNode.children || BookChunkNode.text)
    {
        props.children = [];
        const nodeChildren = props.children as Array<JSX.Element | string>;
        if (BookChunkNode.children)
        {
            for (const child of BookChunkNode.children)
            {
                const childNodeJSX = getBookChunkNodeJSX(child);
                nodeChildren.push(childNodeJSX);
            }
        }
        if (BookChunkNode.text)
        {
            nodeChildren.push(BookChunkNode.text);
        }
    }
    return (<BookChunkNode.name {...props} />);
}

class BookChunk extends Component<IBookChunkProps>
{
    constructor(props: IBookChunkProps)
    {
        super(props);
        console.log(`Book chunk ${props.id} created`);
    }
    componentDidMount(): void
    {
        console.log(`Book chunk ${this.props.id} created`);
    }
    render(): JSX.Element
    {
        return (<div>
            {
                this.props.chunk && this.props.chunk.body && this.props.chunk.body.children ?
                ( this.props.chunk.body.children.map((node) => 
                {
                    return (getBookChunkNodeJSX(node));
                }) )
                : null
            }
        </div>);
    }
}

export interface IBookPageCallbacks
{
    loadBookChunks: (book: IBook) => void;
}

export interface IBookPageProps
{
    book: IBook | null;
    callbacks: IBookPageCallbacks;
}

export function BookPage(props: IBookPageProps): JSX.Element
{
    const book: IBook | null = props.book;

    if (!book)
    {
        return (<div></div>);
    }

    return (
        <div id={bookStyles.wrapper}>
            <div id={bookStyles.container}>
                {
                    book.chunks.map((chunk, index) =>
                    {
                        return (<BookChunk key={index} id={index} chunk={chunk} />);
                    })
                }
            </div>
        </div>
    );
}