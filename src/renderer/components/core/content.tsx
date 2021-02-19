import React from 'react';
import { ETabType, Tab } from '../../misc/tabs';
import ContentStyles from '../../styles/modules/content.module.css';
import { PreferencesSVG, BookmarkSVG, FullscreenSVG, ListSVG, SearchSVG, TextSVG } from '../../misc/icons';
import { IBook } from '../../misc/book';
import { NewTabContent } from '../pages/newTab';
import { ICategory } from '../../misc/category';
import { IBookCallbacks } from './book';
import { IModalData, ModalWrapper } from '../misc/modal';
import { IPreferencesCallbacks, PreferencesPage } from './preferences';
import { IPreferences } from '../../../shared/preferences';
import { BookPage, IBookPageCallbacks, IBookPageProps } from '../pages/book';

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
            return (<div>

            </div>);
        }

        return (<BookPage {...this.props} />);
    }
}

interface IToolbarButtonProps
{
    icon: typeof React.Component;
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
    return (<div className={ContentStyles['toolbar-button']} onClick={handleClick}>
        <props.icon />
    </div>);
}

interface ToolbarProps
{
    bIsBookContent: boolean;
    callbacks: ITabContentCallbacks;
}

function Toolbar(props: ToolbarProps): JSX.Element
{
    return (<div id={ContentStyles['toolbar-wrapper']}>
        <div id={ContentStyles['toolbar-left']}>

        </div>
        <div id={ContentStyles['toolbar-right']}>
            {
                props.bIsBookContent ? (
                    <React.Fragment>
                        <ToolbarButton icon={TextSVG} />
                        <ToolbarButton icon={BookmarkSVG} />
                        <ToolbarButton icon={ListSVG} />
                        <ToolbarButton icon={SearchSVG} />
                        <ToolbarButton icon={FullscreenSVG} />
                    </React.Fragment>
                ) : null
            }
            <ToolbarButton icon={PreferencesSVG} onClick={props.callbacks.onPreferencesClick}/>
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
        <Toolbar bIsBookContent={activeTab.type === ETabType.book} callbacks={props.callbacks}/>
        {
            activeTab.type === ETabType.newTab ?
            <NewTabContent key={activeTab.key} savedBooks={props.savedBooks} categories={props.categories} callbacks={props.callbacks} state={activeTab.state} /> 
            : activeTab.type === ETabType.book ?
            <BookContent key={activeTab.key} book={props.book} callbacks={props.callbacks.bookPageCallbacks}/>
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