import React from 'react';
import { ETabType, Tab } from '../../misc/tabs';
import ContentStyles from '../../styles/modules/content.module.css';
import { PreferencesSVG, BookmarkSVG, FullscreenSVG, ListSVG, SearchSVG, TextSVG } from '../../misc/icons';
import { ipcRenderer } from 'electron';


class NewTabContent extends React.Component
{
    constructor(props)
    {
        super(props);
        console.log(`NewTab Content constructor`);
        this.handleImportBookClick = this.handleImportBookClick.bind(this);
    }
    componentDidMount(): void
    {
        console.log(`NewTab Content did mount`);
    }
    handleImportBookClick()
    {
        ipcRenderer.send('open-file-click');
    }
    render(): JSX.Element
    {
        console.log(`NewTab Content rendered`);
        return (<div
        ><h1>  New Tab </h1>
        <button onClick={this.handleImportBookClick}> Open Book </button>
        </div>);
    }
}

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



export function GenerateTabJSX(props: { type: ETabType }): JSX.Element
{
    let ContentTabClass: typeof React.Component | null = null;
    switch (props.type)
    {
        case ETabType.newTab:
            ContentTabClass = NewTabContent;
            break;
        case ETabType.book:
            ContentTabClass = BookContent;
            break;
        case ETabType.preferences:
            ContentTabClass = PreferencesContent;
            break;
    }
    if (ContentTabClass)
    {
        return (<ContentTabClass />);
    }

    return (<React.Fragment />);
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
            <NewTabContent key={activeTab.key} /> 
            : activeTab.type === ETabType.book ?
            <BookContent key={activeTab.key}/>
            : <PreferencesContent key={activeTab.key}/>
        }
    </div>);
} 