import React, { useState } from 'react';
import { IBook, filterBooksBySearch } from '../../misc/book';
import { ipcRenderer } from 'electron';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { Button } from '../common/button';
import { ListSVG, SearchSVG, GridSVG } from '../../misc/icons';
import { BooksGridView, BooksListView } from '../core/book';
import { ICategory } from '../../misc/category';
import { CategoriesPage, ICategoriesPageCallbacks } from '../core/category';
import { IAppContentCallbacks } from '../core/content';

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

export enum EViewType
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
    searchValue: string;
    setSearchValue: (value: string) => void;
}

function NewTabMenu(props: INewTabMenuProps): JSX.Element
{
    function handleImportBookClick(): void
    {
        ipcRenderer.send('open-file-click');
    }

    function handleSearchInput(event: React.ChangeEvent<HTMLInputElement>): void
    {
        const searchString = event.target.value;
        props.setSearchValue(searchString);
    }

    return (
        <div id={newTabStyles['menu-wrapper']}> 
            <div id={newTabStyles['menu-left']}>
                <MenuElement type={EMenuElementType.Books} activeType={props.activeMenu} setActiveMenu={props.setActiveMenu} />
                <MenuElement type={EMenuElementType.Categories} activeType={props.activeMenu} setActiveMenu={props.setActiveMenu} />
                <Button text={`Import book`} moduleClass="import-book" onClick={handleImportBookClick}/>
            </div>
            <div id={newTabStyles['menu-right']}>
                <div id={newTabStyles['menu-search']}>
                    <input type="text" placeholder={`Search`} value={props.searchValue} onChange={handleSearchInput} />
                    <div id={newTabStyles['menu-search-icon']}>
                        <SearchSVG />
                    </div>
                </div>
                <div id={newTabStyles['view-type-buttons']}>
                    <ViewTypeButton type={EViewType.Grid} activeType={props.viewType} setActiveType={props.setViewType} />
                    <ViewTypeButton type={EViewType.List} activeType={props.viewType} setActiveType={props.setViewType} />
                </div>
            </div>
        </div>);
}

interface INoResultWarningProps
{
    message: string;
    searchQuery: string;
}

/**
 * Renders when there's no books or no categories or no search result
 */
export function NoResultWarning(props: INoResultWarningProps): JSX.Element
{
    return (<div id={newTabStyles['no-result-warning']}>
        <div id={newTabStyles['no-result-text']}>
            {
                props.searchQuery ?
                    `No result for "${props.searchQuery}"`
                : `${props.message}`
            }
        </div>
    </div>);
}

function NewTabPage(props: INewTabContentProps): JSX.Element
{

    const [activeMenu, setActiveMenu] = useState(EMenuElementType.Books);
    const [viewType, setViewType] = useState(EViewType.Grid);
    const [searchValue, setSearchValue] = useState('');

    function clearSearchValue(): void
    {
        if (searchValue !== '')
        {
            setSearchValue('');
        }
    }
    
    function handleMenuElementClick(menu: EMenuElementType): void
    {
        setActiveMenu(menu);
        clearSearchValue();
    }

    /**
     * Formatted search value
     */
    const searchQuery = searchValue.trim().toLowerCase();

    const [booksArray, bookKeys] = searchQuery && activeMenu === EMenuElementType.Books ? filterBooksBySearch(props.savedBooks, searchQuery) : [props.savedBooks, 'ALL'];
    
    const bIsBooksArrayEmpty = booksArray.length === 0;

    const categoriestCallbacks: ICategoriesPageCallbacks = {
        ...props.callbacks,
        clearSearchQuery: clearSearchValue
    };

    return (<div id={newTabStyles.wrapper}>
        <div id={newTabStyles['page-content']}>
            <NewTabMenu activeMenu={activeMenu} viewType={viewType} setActiveMenu={handleMenuElementClick} setViewType={setViewType} searchValue={searchValue} setSearchValue={setSearchValue}/>
            {
                activeMenu === EMenuElementType.Books ?
                (
                    bIsBooksArrayEmpty ?
                    (
                        <NoResultWarning message="No books found" searchQuery={searchValue} />
                    ) : (
                        viewType === EViewType.Grid ? <BooksGridView books={booksArray} keys={bookKeys}/> : <BooksListView books={booksArray} keys={bookKeys}/>
                    )

                ) : <CategoriesPage list={props.categories} viewType={viewType} callbacks={categoriestCallbacks} searchQuery={searchValue} />
            }
        </div>
    </div>);
}

interface INewTabContentProps
{
    savedBooks: Array<IBook>;
    categories: Array<ICategory>;
    callbacks: IAppContentCallbacks;
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
        return (<NewTabPage {...this.props}/>);
    }
}
