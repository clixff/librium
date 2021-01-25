import React from 'react';
import { ETabType, Tab } from '../../misc/tabs';
import ContentStyles from '../../styles/modules/content.module.css';
import { PreferencesSVG, BookmarkSVG, FullscreenSVG, ListSVG, SearchSVG, TextSVG } from '../../misc/icons';
import { IBook } from '../../misc/book';
import { NewTabContent } from '../pages/newTab';


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
    bBookMenu: boolean;
    callbacks: IAppContentCallbacks;
}

function Toolbar(props: ToolbarProps): JSX.Element
{
    return (<div id={ContentStyles['toolbar-wrapper']}>
        <div id={ContentStyles['toolbar-left']}>

        </div>
        <div id={ContentStyles['toolbar-right']}>
            {
                props.bBookMenu ? (
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

export interface IAppContentCallbacks
{
    onPreferencesClick: () => void;
}

interface IAppContentProps
{
    tabsList: Array<Tab>;
    activeTab: number;
    callbacks: IAppContentCallbacks;
    savedBooks: Array<IBook>;
}

export function AppContent(props: IAppContentProps): JSX.Element
{
    const tabsList = props.tabsList;
    const activeTab: Tab | undefined = tabsList[props.activeTab];

    if (!activeTab)
    {
        return (<div></div>);
    }

    return (<div id={ContentStyles.wrapper}>
        <Toolbar bBookMenu={activeTab.type === ETabType.book} callbacks={props.callbacks}/>
        {
            activeTab.type === ETabType.newTab ?
            <NewTabContent key={activeTab.key} savedBooks={props.savedBooks} /> 
            : activeTab.type === ETabType.book ?
            <BookContent key={activeTab.key}/>
            : <PreferencesContent key={activeTab.key}/>
        }
    </div>);
} 