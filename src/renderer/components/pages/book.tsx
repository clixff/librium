import { ipcRenderer } from 'electron';
import React, { Component, useEffect, useState } from 'react';
import { IPreferences } from '../../../shared/preferences';
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

/**
 * Converts a CSS string to the object with React styles.
 * 
 * @param styles CSS string
 */
function getParsedStyles(styles: string): Record<string, string>
{
    const parsedStyles: Record<string, string> = {};
    const fileStyles = (styles).split(';');

    for (let i = 0; i < fileStyles.length; i++)
    {
        const style = fileStyles[i].trim();
        if (style)
        {
            const parsedStyle = style.split(':');
            if (parsedStyle.length === 2)
            {
                let styleName = (parsedStyle[0] || '').trim();
                const styleValue = (parsedStyle[1] || '').trim();
                if (styleName && styleValue)
                {
                    const parsedStyleName = styleName.split('-');

                    /**
                     * Fix case of style name
                     */
                    for (let j = 0; j < parsedStyleName.length; j++)
                    {
                        const styleNamePart = parsedStyleName[j];
                        if (j > 0 && styleNamePart)
                        {
                            parsedStyleName[j] = `${styleNamePart[0].toUpperCase()}${styleNamePart.slice(1)}`;
                        }
                    }

                    styleName = parsedStyleName.join('');


                    parsedStyles[styleName] = styleValue;
                }
            }
        }
    }

    return parsedStyles;
}

function setImageClickCallback(tagName: string, props: Record<string, unknown>): void
{
    const imageSource: string | undefined = (props.src || props['xlinkHref'] || props.srcset) as string;
    if (imageSource)
    {
        const sourceType: string | undefined = props.type as string;

        function isImageLink(): boolean
        {
            const imageFormats = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'svg', 'gif'];

            if (!imageSource)
            {
                return false;
            }

            for (let i = 0; i < imageFormats.length; i++)
            {
                const imageSourceLowerCased = imageSource.toLowerCase();
                if (imageSourceLowerCased.endsWith(`.${imageFormats[i]}`))
                {
                    return true;
                }
            }

            return false;
        }

        if (tagName !== 'source' || (sourceType && sourceType.startsWith('image/')) || isImageLink())
        {
            props.onClick = () => 
            {
                /**
                 * Open image in the browser
                 */
                ipcRenderer.send('open-link', imageSource);
            };
        }
    }
}

interface IBookChunkProps
{
    id: number;
    chunk: IBookChunk;
}

function getBookChunkNode(BookChunkNode: IBookChunkNode, childIndex: number): JSX.Element | null
{
    try
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
        renamePropKey('cellspacing', 'cellSpacing');
        renamePropKey('cellpadding', 'cellPadding');


        const tagName = BookChunkNode.name;

        if (tagName === 'a')
        {
            if (props['title'] === undefined)
            {
                props['title'] = props['href'];
            }
        }
    
        if (tagName === 'img' || tagName === 'image' || tagName === 'source')
        {
            setImageClickCallback(tagName, props);
        }
    
        if (props['style'] && typeof props['style'] === 'string')
        {
            props['style'] = getParsedStyles(props['style']);
        }


        if (BookChunkNode.children || BookChunkNode.text)
        {
            props.children = [];
            const nodeChildren = props.children as Array<JSX.Element | string>;
            if (BookChunkNode.children)
            {
                for (let i = 0; i < BookChunkNode.children.length; i++)
                {
                    const child = BookChunkNode.children[i];
                    const childNodeJSX = getBookChunkNode(child, i);
                    if (childNodeJSX)
                    {
                        nodeChildren.push(childNodeJSX);
                    }
                }
            }
            if (BookChunkNode.text)
            {
                nodeChildren.push(BookChunkNode.text);
            }
        }
    
        props.key = childIndex;
    
        return React.createElement(tagName, props);
    }
    catch (error)
    {
        console.error(error);
    }

    return null;   
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
        const chunkBody: Array<JSX.Element> = [];

        if (this.props.chunk && this.props.chunk.body && this.props.chunk.body.children)
        {
            const bodyChildrenList = this.props.chunk.body.children;
            for (let i = 0; i < bodyChildrenList.length; i++)
            {
                const bodyChild = bodyChildrenList[i];
                const bodyChildNode = getBookChunkNode(bodyChild, i);
                if (bodyChildNode)
                {
                    chunkBody.push(bodyChildNode);
                }
            }
        }

        return (<div>
            {
                chunkBody
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
    preferences: IPreferences;
    callbacks: IBookPageCallbacks;
}

let isTicking = false;
let lastBookMarginBottom = 0;

function setBookMargninBottom(value: number): void
{
    const rootElement = document.documentElement;
    if (rootElement)
    {
        rootElement.style.setProperty('--book-margin-bottom', `${value}px`);
        lastBookMarginBottom = value;
    }
}

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
            setBookMargninBottom(0);
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

    if (bookPageData.bookContainerMarginBottom !== lastBookMarginBottom)
    {
        setBookMargninBottom(bookPageData.bookContainerMarginBottom);
    }

    return (
        <div id={bookStyles.wrapper} onScroll={handleScroll}>
            <div id={bookStyles.container} className={`book_container____`}>
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
