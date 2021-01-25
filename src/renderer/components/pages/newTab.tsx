import React, { useState } from 'react';
import { IBook } from '../../misc/book';
import { ipcRenderer } from 'electron';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { Button } from '../common/button';

interface INewTabPageProps
{
    savedBooks: Array<IBook>;
}

enum ENewPageMenuElement
{
    Books,
    Categories
}

function NewTabPage(props: INewTabPageProps): JSX.Element
{
    const [activeMenu, setActiveMenu] = useState(ENewPageMenuElement.Books);
    return (<div id={newTabStyles.wrapper}>
        <div id={newTabStyles['menu-wrapper']}> 
            <div id={newTabStyles['menu-left']}>
                <div>
                    Books
                </div>
                <div>
                    Categories
                </div>
                <Button text={`Import book`}/>
            </div>
        </div>
    </div>);
}

interface INewTabContentProps
{
    savedBooks: Array<IBook>
}

export class NewTabContent extends React.Component<INewTabContentProps>
{
    constructor(props: INewTabContentProps)
    {
        super(props);
        console.log(`NewTab Content constructor`);
        this.handleImportBookClick = this.handleImportBookClick.bind(this);
    }
    componentDidMount(): void
    {
        console.log(`NewTab Content did mount`);
    }
    handleImportBookClick(): void
    {
        ipcRenderer.send('open-file-click');
    }
    render(): JSX.Element
    {
        console.log(`NewTab Content rendered`);
        return (<NewTabPage savedBooks={this.props.savedBooks}/>);
    }
}
