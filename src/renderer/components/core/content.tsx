import React, { useEffect } from 'react';
import { ETabType } from '../../misc/tabs';

class NewTabContent extends React.Component
{
    constructor(props)
    {
        super(props);
        console.log(`NewTab Content constructor`);
    }
    componentDidMount(): void
    {
        console.log(`NewTab Content did mount`);
    }
    render(): JSX.Element
    {
        console.log(`NewTab Content rendered`);
        return (<div><h1>  New Tab </h1></div>);
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


export function AppContent(): JSX.Element
{

    return (<div>
        <h1>
        
        </h1>
    </div>);
} 