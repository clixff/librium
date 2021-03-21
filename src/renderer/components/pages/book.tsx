import { ipcRenderer } from 'electron';
import React, { Component, useEffect, useState } from 'react';
import { IPreferences } from '../../../shared/preferences';
import { IBookChunk, IBookChunkNode, ITOC } from '../../../shared/schema';
import { IBook, ITOCRenderer } from '../../misc/book';
import { LoadingSVG } from '../../misc/icons';
import { findElementByID, querySelectorWrapper } from '../../misc/misc';
import { getActiveTab, IBookPageData, IBookTabState } from '../../misc/tabs';
import bookStyles from '../../styles/modules/book.module.css';

export function BookLoading(): JSX.Element
{
    return (<div id={bookStyles['loading-wrapper']}>
        <LoadingSVG />
    </div>);
}

let bookCallbacks: IBookPageCallbacks | null = null;

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
    const imageSource: string | undefined = (props.src || props['href'] || props['xlinkHref'] || props.srcset) as string;
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

/**
 * When clicked on 'a' with local href
 */
function setLocalLinkClick(props: Record<string, unknown>): void
{
    const chunkID = Number(props['generated-link-chunk'] as string);
    const linkAnchor = props['generated-link-id'] as string || '';

    props.onClick = () => 
    {
        // console.log(`[link] clicked on link ${props['generated-link-chunk'] || ''}#${linkAnchor || ''}`);

        const bookWrapper = document.getElementById(bookStyles.wrapper);
        const bookContainer = document.getElementById(bookStyles.container);

        if (!bookWrapper || !bookContainer)
        {
            return;
        }

        let chunkElement: HTMLElement | null = null;
        
        if (isFinite(chunkID))
        {
            chunkElement = bookContainer.children[chunkID] as HTMLElement;
        }

        if (isFinite(chunkID) && !chunkElement)
        {
            return;
        }


        let linkAnchorElement: HTMLElement | null = null;

        if (linkAnchor)
        {
            const parentElementForSearch = (isFinite(chunkID) && chunkElement) ? chunkElement : bookContainer;
            linkAnchorElement = querySelectorWrapper((isFinite(chunkID) && chunkElement ? chunkElement : bookContainer), linkAnchor );
            if (!linkAnchorElement)
            {
                linkAnchorElement = findElementByID(parentElementForSearch, linkAnchor);
            }
        }


        /**
         * Scroll to the anchor element or the chunk element
         */
        const scrollTo = linkAnchorElement ? linkAnchorElement.offsetTop : chunkElement ? chunkElement.offsetTop : -1;
        // console.log(`[link] scroll to ${scrollTo}`);

        if (scrollTo === -1)
        {
            return;
        }

        const activeTab = getActiveTab();
        if (bookCallbacks && activeTab && activeTab.state && activeTab.state.data)
        {
            bookCallbacks.updateBookTabState({
                backToPagePercentOfBook: activeTab.state.data.percentReadToSave,
                backToPagePercentOfPages: (activeTab.state.data.currentPage / activeTab.state.data.totalNumberOfPages) 
            });
        }
        bookWrapper.scrollTo({ left: 0, top: scrollTo, behavior: 'auto' });
    };
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

        if (props['generated-link-chunk'] || props['generated-link-id'])
        {
            setLocalLinkClick(props);
            delete props['generated-link-chunk'];
            delete props['generated-link-id'];
        }

        if (tagName === 'video' || tagName === 'audio')
        {
            delete props['autoplay'];
            props.controls = true;
        }


        if (BookChunkNode.children)
        {
            props.children = [];
            const nodeChildren = props.children as Array<JSX.Element | string>;
            for (let i = 0; i < BookChunkNode.children.length; i++)
            {
                const child = BookChunkNode.children[i];
                if (typeof child === 'string' && child)
                {
                    nodeChildren.push(child);
                }
                else
                {
                    const childNodeJSX = getBookChunkNode(child as IBookChunkNode, i);
                    if (childNodeJSX)
                    {
                        nodeChildren.push(childNodeJSX);
                    }
                }
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
        // console.log(`Book chunk ${props.id} created`);
        
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
        // console.log(`Book chunk ${this.props.id} did mount`);
    }
    render(): JSX.Element
    {
        const chunkBody: Array<JSX.Element | string> = [];

        if (this.props.chunk && this.props.chunk.body && this.props.chunk.body.children)
        {
            const bodyChildrenList = this.props.chunk.body.children;
            for (let i = 0; i < bodyChildrenList.length; i++)
            {
                const bodyChild = bodyChildrenList[i];
                if (bodyChild && typeof bodyChild === 'string')
                {
                    chunkBody.push(bodyChild);
                }
                else
                {
                    const bodyChildNode = getBookChunkNode(bodyChild as IBookChunkNode, i);
                    if (bodyChildNode)
                    {
                        chunkBody.push(bodyChildNode);
                    }
                }
            }
        }

        return (<div className={`${bookStyles['chunk']}`}>
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
    openModal: (modal: JSX.Element | null) => void;
    closeModal: () => void;
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

    const book: IBook | null = props.book;

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
        const bookPageData = getBookPageData();
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

            // console.log(`Book height is ${newBookHeight}, book page height is ${newBookPageHeight}`);
            bookPageData.totalNumberOfPages = Math.ceil(newBookHeight / newBookPageHeight);
            // console.log(`Total number of pages is ${bookPageData.totalNumberOfPages}`);

            bookPageData.tableOfContents = [];
            bookPageData.tableOfContentsItems = [];

            calculateTableOfContents();

            const navigationItem = getCurrentNavigationItem();

            props.callbacks.updateBookTabState({
                bookHeight: newBookHeight,
                bookPageHeight: newBookPageHeight,
                totalNumberOfPages: bookPageData.totalNumberOfPages,
                currentPage: Math.floor(bookPageData.bookWrapper.scrollTop / newBookPageHeight) + 1,
                currentNavigationItem: navigationItem
            });
        }
    }

    function handleWindowResize(): void
    {
        // console.log(`Window resized`);
        recalculatePages();
    }

    function getCurrentNavigationItem(): string
    {
        let navigationItem = '';

        const bookPageData = getBookPageData();

        if (bookPageData && bookPageData.tableOfContentsItems && bookPageData.tableOfContentsItems.length)
        {
            const navigationItems = bookPageData.tableOfContentsItems;

            for (let i = 0; i < navigationItems.length; i++)
            {
                const tempNavItem = navigationItems[i];
                if (tempNavItem[0] <= bookPageData.percentReadToSave)
                {
                    navigationItem = tempNavItem[1];
                }
                else
                {
                    return navigationItem;
                }
            }
        }

        return navigationItem;
    }

    function calculateTableOfContents(): void
    {
        const bookPageData = getBookPageData();

        
        bookPageData.tableOfContents = [];
        bookPageData.tableOfContentsItems = [];
        bookPageData.currentNavigationItem = '';

        if (!bookPageData.bookWrapper)
        {
            return;
        }

        const bookContainer = document.getElementById(bookStyles.container);


        function parseTocItem(tocItem: ITOC, parentArray: Array<ITOCRenderer>): void
        {
            try
            {
                if (tocItem)
                {
                    const tocRenderer: ITOCRenderer = {
                        name: tocItem.name,
                        bookPercent: -1,
                        pagesPercent: -1,
                    };
    
                    const bookWrapper = bookPageData.bookWrapper;
                    
                    if (bookWrapper && bookContainer)
                    {
                        const bookChunkElement = bookContainer.children[tocItem.chunk] as HTMLElement;
                        if (bookChunkElement)
                        {
                            let anchorElement: HTMLElement | null = null;
    
                            if (tocItem.anchor)
                            {
                                anchorElement = querySelectorWrapper(bookChunkElement, `#${tocItem.anchor}`);

                                if (!anchorElement)
                                {
                                    anchorElement = findElementByID(bookChunkElement, tocItem.anchor);
                                }
                            }
    
                            const tocElement = tocItem.anchor ? anchorElement : bookChunkElement;
    
                            if (tocElement)
                            {
                                tocRenderer.bookPercent = tocElement.offsetTop / bookPageData.bookHeight;
                                const tocElementPage = Math.ceil(tocElement.offsetTop / bookPageData.bookPageHeight) + 1;
                                tocRenderer.pagesPercent = (tocElementPage / bookPageData.totalNumberOfPages);
                            }
                        }
    
                        parentArray.push(tocRenderer);
                        bookPageData.tableOfContentsItems.push([tocRenderer.bookPercent, tocRenderer.name]);
    
                        if (tocItem.children)
                        {
                            tocRenderer.children = [];
    
                            for (let i = 0; i < tocItem.children.length; i++)
                            {
                                parseTocItem(tocItem.children[i], tocRenderer.children);
                            }
                        }
                    }
                }
            }
            catch (error)
            {
                console.error(error);
            }

        }

        if (book && book.tableOfContents && book.tableOfContents.length)
        {
            const bookTOC = book.tableOfContents;
            for (let i = 0; i < bookTOC.length; i++)
            {
                const tocItem = bookTOC[i];
                parseTocItem(tocItem, bookPageData.tableOfContents);
            }

            bookPageData.tableOfContentsItems.sort((a, b) =>
            {
                if (a[0] < b[0])
                {
                    return -1;
                }
                else if (a[0] > b[0])
                {
                    return 1;
                }
                else
                {
                    return 0;
                }
            });
        }
    }

    function scrollToPercent(percent: number): void
    {
        const bookPageData = getBookPageData();
        if (bookPageData.bookWrapper)
        {
            props.callbacks.updateBookTabState({
                backToPagePercentOfBook: bookPageData.percentReadToSave,
                backToPagePercentOfPages: (bookPageData.currentPage / bookPageData.totalNumberOfPages) 
            });

            const scrollTo = Math.floor(bookPageData.bookHeight * percent);

            bookPageData.bookWrapper.scrollTo({ left: 0, top: scrollTo, behavior: 'auto' });
        }
    }

    useEffect(() => 
    {
        // console.log(`book effect. bTabLoaded: ${bTabLoaded}`);
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

            const bookPageData = getBookPageData();

            if (!bookPageData.tableOfContents.length)
            {
                calculateTableOfContents();
            }

            if (bookPageData.bookWrapper && bookPageData.percentReadToSave)
            {                
                const scrollTo = Math.floor(bookPageData.bookHeight * bookPageData.percentReadToSave);
                bookPageData.bookWrapper.scrollTo({ left: 0, top: scrollTo, behavior: 'auto' });
            }
            else
            {
                const oldNavigationItem = bookPageData.currentNavigationItem;

                bookPageData.currentNavigationItem = getCurrentNavigationItem();
    
                if (oldNavigationItem !== bookPageData.currentNavigationItem)
                {
                    props.callbacks.updateBookTabState({
                        currentNavigationItem: bookPageData.currentNavigationItem
                    });
                }
            }
        }
    }, [bTabLoaded]);

    useEffect(() => 
    {        
    
        window.addEventListener('resize', handleWindowResize);
        bookCallbacks = props.callbacks;

        const bookPageData = getBookPageData();

        bookPageData.scrollToPercent = scrollToPercent;

        const bookContainer = document.getElementById(bookStyles.container);

        return (() =>
        {
            // console.log(`remove resize event`);
            window.removeEventListener('resize', handleWindowResize);

            const bookPageData = getBookPageData();
            bookPageData.bookWrapper = null;
            bookPageData.scrollToPercent = null;
            bookCallbacks = null;
            // console.log(`bookWrapper on unmount is `, bookPageData.bookWrapper);
        });
    }, []);

    // console.log(`Render book`);

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

                    // console.log(`Page ${bookPageData.currentPage} of ${bookPageData.totalNumberOfPages} (${bookWrapper.scrollTop} / ${bookPageData.bookHeight})`);

                    const oldNavigationItem = bookPageData.currentNavigationItem;

                    bookPageData.currentNavigationItem = getCurrentNavigationItem();

                    /**
                     * Update book page number in the toolbar
                     */
                    if (oldPage !== bookPageData.currentPage || oldNavigationItem !== bookPageData.currentNavigationItem)
                    {
                        props.callbacks.updateBookTabState({
                            currentPage: bookPageData.currentPage,
                            currentNavigationItem: bookPageData.currentNavigationItem
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

    const bookPageClassNames = ['book_container____'];

    if (!props.preferences.allowCustomColors)
    {
        bookPageClassNames.push(bookStyles['disable-custom-colors']);
    }

    if (props.preferences.inverseImageColors)
    {
        bookPageClassNames.push(bookStyles['inverse-image-colors']);
    }

    if (props.preferences.widePages)
    {
        bookPageClassNames.push(bookStyles['wide-pages']);
    }

    return (
        <div id={bookStyles.wrapper} onScroll={handleScroll}>
            <div id={bookStyles.container} className={bookPageClassNames.join(' ')}>
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
