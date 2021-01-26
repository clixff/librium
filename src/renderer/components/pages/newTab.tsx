import React, { useState } from 'react';
import { IBook } from '../../misc/book';
import { ipcRenderer } from 'electron';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { Button } from '../common/button';
import { ListSVG, SearchSVG, GridSVG } from '../../misc/icons';
import { BooksGridView, BooksListView } from '../core/book';

interface INewTabPageProps
{
    savedBooks: Array<IBook>;
}

enum EMenuElementType
{
    Books,
    Categories
}

interface IMenuElementProps
{
    type: EMenuElementType;
    activeType: EMenuElementType;
    setActiveMenu: (type: EMenuElementType) => void;
}

function MenuElement(props: IMenuElementProps): JSX.Element
{
    const bIsActive = props.type === props.activeType;
    function handleClick(): void
    {
        if (!bIsActive)
        {
            props.setActiveMenu(props.type);
        }
    }
    return (<div className={`${newTabStyles['menu-element']} ${bIsActive ? newTabStyles['menu-element-active'] : ''}`}
    onClick={handleClick}>
        {
            props.type === EMenuElementType.Books ? `Books` : `Categories`
        }
    </div>);
}

enum EViewType
{
    Grid,
    List
}

interface IViewTypeButtons
{
    type: EViewType;
    activeType: EViewType;
    setActiveType: (type: EViewType) => void;
}

function ViewTypeButton(props: IViewTypeButtons): JSX.Element
{
    const bIsActive = props.type === props.activeType;
    function handleClick(): void
    {
        if (!bIsActive)
        {
            props.setActiveType(props.type);
        }
    }
    return (<div className={`${newTabStyles['view-type-button']} ${bIsActive ? newTabStyles['view-type-button-active'] : ''}`} onClick={handleClick}>
        {
            props.type === EViewType.Grid ? <GridSVG /> : <ListSVG />
        }
    </div>);
}

interface INewTabMenuProps
{
    activeMenu: EMenuElementType;
    viewType: EViewType;
    setActiveMenu: (type: EMenuElementType) => void;
    setViewType: (type: EViewType) => void;
}

function NewTabMenu(props: INewTabMenuProps): JSX.Element
{
    function handleImportBookClick(): void
    {
        ipcRenderer.send('open-file-click');
    }

    return (
        <div id={newTabStyles['menu-wrapper']}> 
            <div id={newTabStyles['menu-left']}>
                <MenuElement type={EMenuElementType.Books} activeType={props.activeMenu} setActiveMenu={props.setActiveMenu} />
                <MenuElement type={EMenuElementType.Categories} activeType={props.activeMenu} setActiveMenu={props.setActiveMenu} />
                <Button text={`Import book`} moduleClass="import-book" onClick={handleImportBookClick}/>
            </div>
            <div id={newTabStyles['menu-right']}>
                {
                    props.activeMenu === EMenuElementType.Books ?
                    (
                        <div id={newTabStyles['menu-search']}>
                            <input type="text" placeholder={`Search`} />
                            <div id={newTabStyles['menu-search-icon']}>
                                <SearchSVG />
                            </div>
                        </div>
                    ) : null
                }
                <div id={newTabStyles['view-type-buttons']}>
                    <ViewTypeButton type={EViewType.Grid} activeType={props.viewType} setActiveType={props.setViewType} />
                    <ViewTypeButton type={EViewType.List} activeType={props.viewType} setActiveType={props.setViewType} />
                </div>
            </div>
        </div>);
}



function NewTabPage(props: INewTabPageProps): JSX.Element
{

    const [activeMenu, setActiveMenu] = useState(EMenuElementType.Books);
    const [viewType, setViewType] = useState(EViewType.Grid);

    /**
     * TODO: Implement search
     */
    const booksArray = props.savedBooks;

    return (<div id={newTabStyles.wrapper}>
        <div id={newTabStyles['page-content']}>
            <NewTabMenu activeMenu={activeMenu} viewType={viewType} setActiveMenu={setActiveMenu} setViewType={setViewType} />
            {
                activeMenu === EMenuElementType.Books ?
                (
                    viewType === EViewType.Grid ? <BooksGridView books={booksArray}/> : <BooksListView books={booksArray} />
                ) : null
            }
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
    }
    componentDidMount(): void
    {
        console.log(`NewTab Content did mount`);
    }
    render(): JSX.Element
    {
        console.log(`NewTab Content rendered`);
        return (<NewTabPage savedBooks={this.props.savedBooks}/>);
    }
}
