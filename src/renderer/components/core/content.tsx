import React from 'react';
import { ETabType, Tab } from '../../misc/tabs';
import ContentStyles from '../../styles/modules/content.module.css';
import { PreferencesSVG, BookmarkSVG, FullscreenSVG, ListSVG, SearchSVG, TextSVG } from '../../misc/icons';
import { IBook } from '../../misc/book';
import { NewTabContent } from '../pages/newTab';
import { ICategory } from '../../misc/category';
import { IBookCallbacks } from './book';
import { IModalData, ModalWrapper } from '../misc/modal';


class BookContent extends React.Component
{
    constructor(props)
    {
        super(props);
        console.log(`BookContent constructor`);
    }
    componentDidMount(): void
    {
        console.log(`BookContent did mount`);
    }
    render(): JSX.Element
    {
        console.log(`BookContent rendered`);
        return (<div><h1>  BookContent </h1></div>);
    }
}


class PreferencesContent extends React.Component
{
    constructor(props)
    {
        super(props);
        console.log(`Preferences constructor`);
    }
    componentDidMount(): void
    {
        console.log(`Preferences did mount`);
    }
    render(): JSX.Element
    {
        console.log(`Preferences rendered`);
        return (<div><h1>  Preferences </h1></div>);
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
}

interface ITabContentProps
{
    tabsList: Array<Tab>;
    activeTab: number;
    callbacks: ITabContentCallbacks;
    savedBooks: Array<IBook>;
    categories: Array<ICategory>;
    modal: IModalData;
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
            <BookContent key={activeTab.key}/>
            : <PreferencesContent key={activeTab.key}/>
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