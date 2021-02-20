import React, { Component, useEffect, useState } from 'react';
import { IBookChunk, IBookChunkNode } from '../../../shared/schema';
import { IBook } from '../../misc/book';
import bookStyles from '../../styles/modules/book.module.css';


interface IBookChunkProps
{
    id: number;
    chunk: IBookChunk;
}

function getBookChunkNodeJSX(BookChunkNode: IBookChunkNode, childIndex: number): JSX.Element
{
    let props = BookChunkNode.attr as Record<string, unknown>;
    if (!props)
    {
        props = {};
    }

    function renamePropKey(oldKey, newKey)
    {
        if (props[oldKey])
        {
            props[newKey] = props[oldKey];
            delete props[oldKey];
        }
    }
    
    renamePropKey('class', 'className');
    renamePropKey('xmlns:xlink', 'xmlnsXlink');
    renamePropKey('xlink:href', 'xlinkHref');
    renamePropKey('colspan', 'colSpan');
    renamePropKey('xml:lang', 'xmlLang');

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
            for (let i = 0; i < BookChunkNode.children.length; i++)
            {
                const child = BookChunkNode.children[i];
                const childNodeJSX = getBookChunkNodeJSX(child, i);
                nodeChildren.push(childNodeJSX);
            }
        }
        if (BookChunkNode.text)
        {
            nodeChildren.push(BookChunkNode.text);
        }
    }
    return (<BookChunkNode.name key={childIndex} {...props} />);
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
        console.log(`Book chunk ${this.props.id} did mount`);
    }
    render(): JSX.Element
    {
        return (<div>
            {
                this.props.chunk && this.props.chunk.body && this.props.chunk.body.children ?
                ( this.props.chunk.body.children.map((node, index) => 
                {
                    return (getBookChunkNodeJSX(node, index));
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

let bookHeight = 0;
let bookPageHeight = 0;
let totalNumberOfPages = 0;
let lastPageOffset = 0;

export const BookPage = React.memo((props: IBookPageProps): JSX.Element =>
{
    const [bTabLoaded, setTabLoaded] = useState(false);

    function recalculatePages(): void
    {
        const bookWrapper = document.getElementById(bookStyles.wrapper);
        if (bookWrapper)
        {
            bookHeight = bookWrapper.scrollHeight;
            bookPageHeight = bookWrapper.clientHeight;
            console.log(`Book height is ${bookHeight}, book page height is ${bookPageHeight}`);
            totalNumberOfPages = Math.ceil(bookHeight / bookPageHeight);
            lastPageOffset = (totalNumberOfPages - 1) * bookPageHeight;
            console.log(`lastPageOffset is ${lastPageOffset}`);
            console.log(`Total number of pages is ${totalNumberOfPages + 1}`);
        }
    }
    
    useEffect(() => 
    {
        console.log(`book effect. bTabLoaded: ${bTabLoaded}`);
        if (!bTabLoaded)
        {
            /**
             * Wait for the first empty background render, then render book chunks.
             * This is useful for making book loading less noticeable and annoying.
             */
            setTabLoaded(true);
        }
        else
        {
            recalculatePages();
        }
        

    }, [bTabLoaded]);

    console.log(`Render book`);
    const book: IBook | null = props.book;

    if (!book)
    {
        return (<div></div>);
    }

    function handleScroll(event: React.UIEvent<HTMLDivElement>): void
    {
        if (!event.isTrusted)
        {
            return;
        }
        const bookWrapper: HTMLDivElement = event.target as HTMLDivElement;
        if (bookWrapper)
        {
            const pageNumber = Math.floor(bookWrapper.scrollTop / bookPageHeight) + 1;
            console.log(`Page ${pageNumber} of ${totalNumberOfPages} (${bookWrapper.scrollTop} / ${lastPageOffset})`);
        }
    }

    return (
        <div id={bookStyles.wrapper} onScroll={handleScroll}>
            <div id={bookStyles.container}>
                {
                    !bTabLoaded ? null :
                    book.chunks.map((chunk, index) =>
                    {
                        return (<BookChunk key={index} id={index} chunk={chunk} />);
                    })
                }
            </div>
        </div>
    );
},
/**
 * Do not re-render BookPage
 */ 
() =>
{
    return true;
});
