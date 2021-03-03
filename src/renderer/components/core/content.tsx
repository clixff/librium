import React from 'react';
import { ETabType, IBookPageData, IBookTabState, Tab } from '../../misc/tabs';
import ContentStyles from '../../styles/modules/content.module.css';
import { PreferencesSVG, BookmarkSVG, FullscreenSVG, ListSVG, SearchSVG, TextSVG } from '../../misc/icons';
import { IBook } from '../../misc/book';
import { NewTabContent } from '../pages/newTab';
import { ICategory } from '../../misc/category';
import { IBookCallbacks } from './book';
import { IModalData, ModalWrapper } from '../misc/modal';
import { IPreferencesCallbacks, PreferencesPage } from './preferences';
import { IPreferences } from '../../../shared/preferences';
import { BookLoading, BookPage, IBookPageCallbacks, IBookPageProps } from '../pages/book';

interface IBookContentState
{
    bLoaded: boolean;
}

class BookContent extends React.Component<IBookPageProps, IBookContentState>
{
    constructor(props)
    {
        super(props);
        this.state = {
            bLoaded: !!(this.props.book && this.props.book.chunks.length)
        };
        console.log(`BookContent constructor`);
    }
    componentDidMount(): void
    {
        console.log(`BookContent did mount`);
        if (!this.state.bLoaded && this.props.book)
        {
            this.props.callbacks.loadBookChunks(this.props.book);
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
        console.log(`BookContent rendered`);
        if (!this.state.bLoaded)
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
    return (<div className={ContentStyles['toolbar-button']} onClick={handleClick} title={props.title || ''}>
        <props.icon />
    </div>);
}

interface ToolbarProps
{
    bIsBookContent: boolean;
    callbacks: ITabContentCallbacks;
    tab: Tab;
}

function Toolbar(props: ToolbarProps): JSX.Element
{
    let bookData: IBookPageData | null = null;

    if (props.bIsBookContent && props.tab.state && props.tab.state.data)
    {
        bookData = props.tab.state.data;
    }

    return (<div id={ContentStyles['toolbar-wrapper']}>
        <div id={ContentStyles['toolbar-left']}>
            {
                bookData ?
                    (
                        <React.Fragment>
                            <div id={ContentStyles['toolbar-book-chapter']}>
                                Chapter 1
                            </div>
                            <div id={ContentStyles['toolbar-book-page']}>
                                Page <b> { bookData.currentPage } </b> of { bookData.totalNumberOfPages }
                            </div>
                            <div id={ContentStyles['toolbar-book-percent']}>
                                { `${Math.floor((bookData.currentPage / bookData.totalNumberOfPages) * 100) || 0}%` }
                            </div>
                            <div id={ContentStyles['toolbar-book-back-to-page']}>
                                { `Back to page ${bookData.backToPageNumber}` }
                            </div>
                        </React.Fragment>
                    )
                : null
            }
        </div>
        <div id={ContentStyles['toolbar-right']}>
            {
                props.bIsBookContent ? (
                    <React.Fragment>
                        <ToolbarButton icon={TextSVG} title={`Book settings`} />
                        <ToolbarButton icon={BookmarkSVG} title={`Bookmarks`} />
                        <ToolbarButton icon={ListSVG} title={`Table of Contents`} />
                        <ToolbarButton icon={SearchSVG} title={`Search`} />
                        <ToolbarButton icon={FullscreenSVG} title={`Fullscreen`} />
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

    return (<div id={ContentStyles.wrapper}>
        <Toolbar bIsBookContent={activeTab.type === ETabType.book} callbacks={props.callbacks} tab={activeTab} />
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