import React, { useEffect, useState } from 'react';
import { ETabType, IBookPageData, IBookTabState, Tab } from '../../misc/tabs';
import ContentStyles from '../../styles/modules/content.module.css';
import { PreferencesSVG, BookmarkSVG, FullscreenSVG, ListSVG, SearchSVG, TextSVG } from '../../misc/icons';
import { IBook } from '../../misc/book';
import { NewTabContent } from '../pages/newTab';
import { ICategory } from '../../misc/category';
import { IBookCallbacks } from './book';
import { IModalData, ModalWrapper, TableOfContentsMenu } from '../misc/modal';
import { IPreferencesCallbacks, PreferencesPage } from './preferences';
import { IPreferences } from '../../../shared/preferences';
import { BookLoading, BookPage, IBookPageCallbacks, IBookPageProps } from '../pages/book';
import { changeFullScreenMode } from '../../misc/misc';
import { ToolbarDropdownBookmarks, ToolbarDropdownSearch, ToolbarDropdownSettings, ToolbarDropdownWrapper } from '../misc/toolbarDropdown'; 

interface IBookContentState
{
    bLoaded: boolean;
}

class BookContent extends React.Component<IBookPageProps, IBookContentState>
{
    stylesClassName = 'custom-style';
    stylesElements: Array<HTMLLinkElement> = [];
    constructor(props)
    {
        super(props);
        this.state = {
            bLoaded: !!(this.props.book && this.props.book.chunks.length)
        };
        
        // console.log(`BookContent constructor`);
    }
    componentDidMount(): void
    {
        // console.log(`BookContent did mount`);
        if (!this.state.bLoaded && this.props.book)
        {
            this.props.callbacks.loadBookChunks(this.props.book);
        }

        if (this.props.book && this.props.book.styles.length)
        {
            const stylesList = this.props.book.styles;
            for (let i = 0; i < stylesList.length; i++)
            {
                const styleFilePath = stylesList[i];
                const fullStylePath = `http://127.0.0.1:45506/file/${this.props.book.id}/${styleFilePath}`;
                const linkElement = document.createElement('link');
                linkElement.setAttribute('rel', 'stylesheet');
                linkElement.setAttribute('type', 'text/css');
                linkElement.setAttribute('href', fullStylePath);
                linkElement.classList.add(this.stylesClassName);
                document.head.appendChild(linkElement);
                this.stylesElements.push(linkElement);
            }
        }
    }
    componentWillUnmount(): void
    {
        if (this.stylesElements.length)
        {
            for (let i = 0; i < this.stylesElements.length; i++)
            {
                const styleElement = this.stylesElements[i];
                if (styleElement)
                {
                    styleElement.remove();
                }
            }

            this.stylesElements = [];
        }
        
    }
    componentDidUpdate()
    {
        if (!this.state.bLoaded && this.props.book && this.props.book.chunks.length)
        {
            this.setState({
                bLoaded: true
            });
        }
    }
    render(): JSX.Element
    {
        // console.log(`BookContent rendered`);
        if (!this.state.bLoaded )
        {
            return <BookLoading />;
        }

        return (<BookPage {...this.props} />);
    }
}

interface IToolbarButtonProps
{
    icon: typeof React.Component;
    title?: string;
    bWithDropdown?: boolean;
    onClick?: () => void;
}

function ToolbarButton(props: IToolbarButtonProps): JSX.Element
{
    function handleClick(): void
    {
        if (typeof props.onClick === 'function')
        {
            props.onClick();
        }
    }
    return (<div className={`${ContentStyles['toolbar-button']} ${props.bWithDropdown ? 'toolbar-button-with-dropdown' : ''}`} onClick={handleClick} title={props.title || ''}>
        <props.icon />
    </div>);
}

interface ToolbarProps
{
    bIsBookContent: boolean;
    callbacks: ITabContentCallbacks;
    tab: Tab;
    isFullScreen: boolean;
    preferences: IPreferences;
}


function Toolbar(props: ToolbarProps): JSX.Element
{
    const [toolbarDropdown, setDropdown] = useState<{ element: JSX.Element | null, rightOffset: number }>({
        element: (<> </>),
        rightOffset: 0
    });


    function closeDropdown(): void
    {
        setDropdown({
            element: null,
            rightOffset: 0
        });
    }

    function openDropdown(dropdownElement: JSX.Element, rightOffset: number): void
    {
        setDropdown({
            element: dropdownElement,
            rightOffset: rightOffset
        });
    }

    let bookData: IBookPageData | null = null;

    if (props.bIsBookContent && props.tab.state && props.tab.state.data)
    {
        bookData = props.tab.state.data;
    }

    function handleBackToPageClick(): void
    {
        if (bookData)
        {
            const bookWrapper = bookData.bookWrapper;
            const backToPagePercent = bookData.backToPagePercentOfBook;
            const bookHeight = bookData.bookHeight;
            if (bookWrapper)
            {
                if (typeof props.callbacks.bookPageCallbacks.updateBookTabState === 'function')
                {
                    props.callbacks.bookPageCallbacks.updateBookTabState({
                        backToPagePercentOfBook: -1,
                        backToPagePercentOfPages: 0
                    });
                }
                bookWrapper.scrollTo({ left: 0, top: Math.floor(bookHeight * backToPagePercent), behavior: 'auto' });
            }
        }
    }

    function handleTableOfContentsClick(): void
    {
        if (bookData)
        {
            const tocMenu = <TableOfContentsMenu totalNumberOfPages={bookData.totalNumberOfPages} tocItems={bookData.tableOfContents} scrollToPercent={bookData.scrollToPercent} closeModal={props.callbacks.bookPageCallbacks.closeModal} currentScrollPercent={bookData.percentReadToSave} />;

            props.callbacks.bookPageCallbacks.openModal(tocMenu);
        }
    }

    function handleFullScreenClick(): void
    {
        changeFullScreenMode();
    }

    function handleBookSettingsClick(): void
    {
        openDropdown(<ToolbarDropdownSettings preferences={props.preferences} />, 151);
    }

    function handleBookmarksClick(): void
    {
        openDropdown(<ToolbarDropdownBookmarks closeDropdown={closeDropdown} />, 114);
    }

    function handleSearchClick(): void
    {
        openDropdown(<ToolbarDropdownSearch />, 100);
    }

    useEffect(() =>
    {
        if (toolbarDropdown.element)
        {
            closeDropdown();
        }
    }, [props.tab]);

    return (<div id={ContentStyles['toolbar-wrapper']}>
        <div id={ContentStyles['toolbar-left']}>
            {
                bookData ?
                    (
                        <React.Fragment>
                            {
                                bookData.currentNavigationItem ?
                                (
                                    <div id={ContentStyles['toolbar-book-chapter']} onClick={handleTableOfContentsClick}>
                                        {
                                            bookData.currentNavigationItem
                                        }
                                    </div>
                                ) : null
                            }
                            <div id={ContentStyles['toolbar-book-page']}>
                                Page <b> { bookData.currentPage } </b> of { bookData.totalNumberOfPages }
                            </div>
                            <div id={ContentStyles['toolbar-book-percent']}>
                                { `${Math.floor((bookData.currentPage / bookData.totalNumberOfPages) * 100) || 0}%` }
                            </div>
                            {
                                bookData.backToPagePercentOfBook !== -1 ?
                                (
                                    <div id={ContentStyles['toolbar-book-back-to-page']} onClick={handleBackToPageClick}>
                                        { `Back to page ${Math.floor(bookData.backToPagePercentOfPages * bookData.totalNumberOfPages) || 0}` }
                                    </div>
                                ) : null
                            }
                        </React.Fragment>
                    )
                : null
            }
        </div>
        <div id={ContentStyles['toolbar-right']}>
            {
                toolbarDropdown.element ?
                <ToolbarDropdownWrapper isFullScreen={props.isFullScreen} rightOffset={toolbarDropdown.rightOffset} closeDropdown={closeDropdown}>
                    {
                        toolbarDropdown.element
                    }
                </ToolbarDropdownWrapper>
                : null
            }
            {
                props.bIsBookContent ? (
                    <React.Fragment>
                        <ToolbarButton icon={TextSVG} title={`Book settings`} onClick={handleBookSettingsClick} bWithDropdown={true} />
                        <ToolbarButton icon={BookmarkSVG} title={`Bookmarks`} onClick={handleBookmarksClick} bWithDropdown={true} />
                        <ToolbarButton icon={ListSVG} title={`Table of Contents`} onClick={handleTableOfContentsClick} />
                        {/* <ToolbarButton icon={SearchSVG} title={`Search`} onClick={handleSearchClick} bWithDropdown={true} /> */}
                        <ToolbarButton icon={FullscreenSVG} title={`Fullscreen`} onClick={handleFullScreenClick}  />
                    </React.Fragment>
                ) : null
            }
            <ToolbarButton icon={PreferencesSVG} onClick={props.callbacks.onPreferencesClick} title={`Preferences`}/>
        </div>
    </div>);
}

export interface ITabContentCallbacks
{
    onPreferencesClick: () => void;
    onCategoryDelete: (id: number) => void;
    createCategory: () => void;
    newTabBooksCallbacks: IBookCallbacks;
    preferencesCallbacks: IPreferencesCallbacks;
    bookPageCallbacks: IBookPageCallbacks;
}

interface ITabContentProps
{
    tabsList: Array<Tab>;
    activeTab: number;
    callbacks: ITabContentCallbacks;
    savedBooks: Array<IBook>;
    categories: Array<ICategory>;
    modal: IModalData;
    preferences: IPreferences;
    /**
     * Active book if current tab type is Book
     */
    book: IBook | null;
    isFullScreen: boolean;
    closeModal: () => void;
}

export function TabContent(props: ITabContentProps): JSX.Element
{
    const tabsList = props.tabsList;
    const activeTab: Tab | undefined = tabsList[props.activeTab];

    if (!activeTab)
    {
        return (<div></div>);
    }

    return (<div id={ContentStyles.wrapper} className={`${props.isFullScreen ? ContentStyles['fullscreen-wrapper'] : '' }`}>
        <Toolbar bIsBookContent={activeTab.type === ETabType.book} callbacks={props.callbacks} tab={activeTab} isFullScreen={props.isFullScreen} preferences={props.preferences} />
        {
            activeTab.type === ETabType.newTab ?
            <NewTabContent key={activeTab.key} savedBooks={props.savedBooks} categories={props.categories} callbacks={props.callbacks} state={activeTab.state} /> 
            : activeTab.type === ETabType.book ?
            <BookContent key={activeTab.key} book={props.book} callbacks={props.callbacks.bookPageCallbacks} tabState={ activeTab.state as IBookTabState } preferences={props.preferences} />
            : <PreferencesPage key={activeTab.key} preferences={props.preferences} callbacks={props.callbacks.preferencesCallbacks} />
        }
        {
            props.modal && props.modal.element ?
                (<ModalWrapper closeModal={props.closeModal} key={props.modal.createdAt} isClosing={props.modal.isClosing} >
                    {
                        props.modal.element
                    }
                </ModalWrapper>)
            : null
        }
    </div>);
} 