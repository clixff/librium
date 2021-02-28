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
    updateBookReadPercent: (book: IBook, percent: number, percentPages: number) => void;
}

export interface IBookPageProps
{
    book: IBook | null;
    tabState: IBookTabState;
    callbacks: IBookPageCallbacks;
}

let isTicking = false;

export const BookPage = React.memo((props: IBookPageProps): JSX.Element =>
{
    const [bTabLoaded, setTabLoaded] = useState(false);

    function getBookPageData(): IBookPageData
    {
        return props.tabState.data;
    }

    const bookPageData = getBookPageData();

    function getContainerMarginBottom(): number
    {
        return Math.max(((bookPageData.totalNumberOfPages * bookPageData.bookPageHeight) - bookPageData.bookHeight), 0);
    }

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
            console.log(`Total number of pages is ${bookPageData.totalNumberOfPages}`);

            props.callbacks.updateBookTabState({
                bookHeight: newBookHeight,
                bookPageHeight: newBookPageHeight,
                totalNumberOfPages: bookPageData.totalNumberOfPages,
                currentPage: Math.floor(bookPageData.bookWrapper.scrollTop / newBookPageHeight) + 1
            });
        }
    }

    function handleWindowResize(): void
    {
        console.log(`Window resized`);
        recalculatePages();
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

            if (bookPageData.bookWrapper && bookPageData.percentReadToSave)
            {                
                const scrollTo = Math.floor(bookPageData.bookHeight * bookPageData.percentReadToSave);
                bookPageData.bookWrapper.scrollTo({ left: 0, top: scrollTo, behavior: 'auto' });
            }
        }
    }, [bTabLoaded]);

    useEffect(() => 
    {        
    
        window.addEventListener('resize', handleWindowResize);

        return (() =>
        {
            console.log(`remove resize event`);
            window.removeEventListener('resize', handleWindowResize);

            const bookPageData = getBookPageData();
            bookPageData.bookWrapper = null;
            console.log(`bookWrapper on unmount is `, bookPageData.bookWrapper);
        });
    }, []);

    console.log(`Render book`);
    const book: IBook | null = props.book;

    if (!book)
    {
        return (<div></div>);
    }

    function handleScroll(event: React.UIEvent<HTMLDivElement>): void
    {
        console.log(event);
        console.log(`event.isTrusted: ${event.isTrusted}`);
        if (!event.isTrusted)
        {
            return;
        }


        if (!isTicking)
        {
            window.requestAnimationFrame(() =>
            {
                const bookWrapper: HTMLDivElement = event.target as HTMLDivElement;
                if (bookWrapper)
                {
                    recalculatePages();
                    bookPageData.percentReadToSave = bookWrapper.scrollTop / (bookPageData.bookHeight);
                    const oldPage = bookPageData.currentPage;
                    bookPageData.currentPage = Math.floor(bookWrapper.scrollTop / bookPageData.bookPageHeight) + 1;

                    if (!isFinite(bookPageData.currentPage))
                    {
                        bookPageData.currentPage = 1;
                    }

                    console.log(`Page ${bookPageData.currentPage} of ${bookPageData.totalNumberOfPages} (${bookWrapper.scrollTop} / ${bookPageData.bookHeight})`);

                    /**
                     * Update book page number in the toolbar
                     */
                    if (oldPage !== bookPageData.currentPage)
                    {
                        props.callbacks.updateBookTabState({
                            currentPage: bookPageData.currentPage
                        });
                    }
                    
                    /**
                     * Save book read percent to disk
                     */
                    if (props.book)
                    {
                        const bookPagesPercent = Math.floor((bookPageData.currentPage / bookPageData.totalNumberOfPages) * 100);
                        props.callbacks.updateBookReadPercent(props.book, bookPageData.percentReadToSave, bookPagesPercent);
                    }


                }
                isTicking = false;
            });
            
            isTicking = true;
        }
    }

    bookPageData.bookContainerMarginBottom = getContainerMarginBottom();

    return (
        <div id={bookStyles.wrapper} onScroll={handleScroll}>
            <div id={bookStyles.container} style={ {
            marginBottom: `${bookPageData.bookContainerMarginBottom}px`
            } }>
                {
                    !bTabLoaded ? <BookLoading /> :
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
