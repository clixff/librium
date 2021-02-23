import React, { Component, useEffect, useState } from 'react';
import { IBookChunk, IBookChunkNode } from '../../../shared/schema';
import { IBook } from '../../misc/book';
import { LoadingSVG } from '../../misc/icons';
import { IBookPageData, IBookTabState } from '../../misc/tabs';
import bookStyles from '../../styles/modules/book.module.css';

export function BookLoading(): JSX.Element
{
    return (<div id={bookStyles['loading-wrapper']}>
        <LoadingSVG />
    </div>);
}

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
    /**
     * Do not re-render book chunk
     */
    shouldComponentUpdate(): boolean
    {
        return false;
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
    updateBookTabState: (data: Partial<IBookPageData>) => void;
}

export interface IBookPageProps
{
    book: IBook | null;
    tabState: IBookTabState;
    callbacks: IBookPageCallbacks;
}

// let bookHeight = 0;
// let bookPageHeight = 0;
// let totalNumberOfPages = 0;
// let lastPageOffset = 0;
// let bookContainerMarginBottom = 0;
// let bookWrapper: HTMLElement | null = null;

export const BookPage = React.memo((props: IBookPageProps): JSX.Element =>
{
    const [bTabLoaded, setTabLoaded] = useState(false);
    
    const bookPageData = props.tabState.data;

    function getBookWrapperElement(): void
    {
        if (!bookPageData.bookWrapper)
        {
            bookPageData.bookWrapper = document.getElementById(bookStyles.wrapper);
        }
    }

    function recalculatePages(): void
    {
        getBookWrapperElement();
        if (bookPageData.bookWrapper)
        {
            const newBookHeight = bookPageData.bookWrapper.scrollHeight - bookPageData.bookContainerMarginBottom;
            const newBookPageHeight = bookPageData.bookWrapper.clientHeight;

            if (newBookHeight === bookPageData.bookHeight && newBookPageHeight === bookPageData.bookPageHeight)
            {
                return;
            }
            

            bookPageData.bookHeight = newBookHeight;
            bookPageData.bookPageHeight = newBookPageHeight;

            console.log(`Book height is ${newBookHeight}, book page height is ${newBookPageHeight}`);
            bookPageData.totalNumberOfPages = Math.ceil(newBookHeight / newBookPageHeight);
            // lastPageOffset = (totalNumberOfPages - 1) * bookPageHeight;
            // console.log(`lastPageOffset is ${lastPageOffset}`);
            console.log(`Total number of pages is ${bookPageData.totalNumberOfPages}`);
            props.callbacks.updateBookTabState({
                bookHeight: newBookHeight,
                bookPageHeight: newBookPageHeight
            });
            // setBookPagesData({
            //     totalNumberOfPages: totalNumberOfPages,
            //     bookHeight: bookHeight,
            //     bookPageHeight: bookPageHeight
            // });
        }
    }
    
    useEffect(() => 
    {
        console.log(`book effect. bTabLoaded: ${bTabLoaded}`);
        if (!bTabLoaded)
        {
            bookPageData.bookContainerMarginBottom = 0;
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
        
        return (() =>
        {
            bookPageData.bookWrapper = null;
        });

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
            recalculatePages();
            const scrollPercent = bookWrapper.scrollTop / bookPageData.bookHeight;
            bookPageData.currentPage = Math.floor(bookWrapper.scrollTop / bookPageData.bookPageHeight) + 1;
            if (!isFinite(bookPageData.currentPage))
            {
                bookPageData.currentPage = 1;
            }
            console.log(`Page ${bookPageData.currentPage} of ${bookPageData.totalNumberOfPages} (${bookWrapper.scrollTop})`);
            props.callbacks.updateBookTabState({
                currentPage: bookPageData.currentPage,
                percentReadToSave: scrollPercent
            });
        }
    }

    bookPageData.bookContainerMarginBottom = Math.max(((bookPageData.totalNumberOfPages * bookPageData.bookPageHeight) - bookPageData.bookHeight), 0);

    return (
        <div id={bookStyles.wrapper} onScroll={handleScroll}>
            <div id={bookStyles.container} style={ {
            marginBottom: `${bookPageData.bookContainerMarginBottom}px`
            } }>
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
 * Are props equal
 */
(prevProps, nextProps) =>
{
    return false;
    const prevBookPageData = prevProps.tabState.data;
    const nextBookPageData = nextProps.tabState.data;

    /**
     * Re-render the book page only if window size or font changed
     */
    return prevBookPageData.bookHeight === nextBookPageData.bookHeight && prevBookPageData.bookPageHeight === nextBookPageData.bookPageHeight;
});
