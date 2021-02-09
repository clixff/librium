import React, { useState } from 'react';
import { IBook, filterBooksBySearch } from '../../misc/book';
import { ipcRenderer } from 'electron';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { Button } from '../common/button';
import { ListSVG, SearchSVG, GridSVG } from '../../misc/icons';
import { getBooksViewComponent, IBookCallbacks } from '../core/book';
import { ICategory } from '../../misc/category';
import { CategoriesPage, ICategoriesPageCallbacks } from '../core/category';
import { ITabContentCallbacks } from '../core/content';
import { TabState } from '../../misc/tabs';

export enum EMenuElementType
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
        if (!bIsActive || props.type === EMenuElementType.Categories)
        {
            props.setActiveMenu(props.type);
        }
    }
    return (<div className={`${newTabStyles['menu-element']} ${bIsActive ? newTabStyles['menu-element-active'] : ''} ${props.type === EMenuElementType.Categories ? newTabStyles['menu-element-categories'] : ''} `}
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
    let defaultActiveMenu = EMenuElementType.Books;
    let defaultActiveCategory = -1;
    let defaultViewType = EViewType.Grid;

    if (props.state)
    {
        if (props.state.menu !== undefined)
        {
            defaultActiveMenu = props.state.menu;
        }
        if (props.state.activeCategory !== undefined)
        {
            defaultActiveCategory = props.state.activeCategory;
        }
        if (props.state.viewType !== undefined)
        {
            defaultViewType = props.state.viewType;
        }
    }

    const [activeMenu, setActiveMenu] = useState(defaultActiveMenu);
    const [viewType, setViewType] = useState(defaultViewType);
    const [searchValue, setSearchValue] = useState('');
    const [activeCategry, setActiveCategory] = useState(defaultActiveCategory);

    function clearSearchValue(): void
    {
        if (searchValue !== '')
        {
            setSearchValue('');
        }
    }
    
    function handleMenuElementClick(menu: EMenuElementType): void
    {
        /**
         * If user is viewing a category, clicking on the `Categories` button will return to the list of categories
         */
        if (menu === EMenuElementType.Categories && activeCategry !== -1)
        {
            updateActiveCategory(-1);
        }

        setActiveMenu(menu);
        clearSearchValue();

        /**
         * Update active menu in the tab state
         */
        if (props.state)
        {
            props.state.menu = menu;
        }
    }

    function updateActiveCategory(category: number): void
    {
        setActiveCategory(category);

        /**
         * Update active category in the tab state
         */
        if (props.state)
        {
            props.state.activeCategory = category;
        }
    }

    function updateViewType(type: EViewType): void
    {
        setViewType(type);
        
        /**
         * Update view type in the tab state
         */

        if (props.state)
        {
            props.state.viewType = type;
        }
    }

    /**
     * Formatted search value
     */
    const searchQuery = searchValue.trim().toLowerCase();

    const [booksArray, booksKeys] = searchQuery && activeMenu === EMenuElementType.Books ? filterBooksBySearch(props.savedBooks, searchQuery) : [props.savedBooks, 'ALL'];
    
    const bIsBooksArrayEmpty = booksArray.length === 0;

    const categoriestCallbacks: ICategoriesPageCallbacks = {
        ...props.callbacks,
        clearSearchQuery: clearSearchValue,
        setActiveCategory: updateActiveCategory
    };


    return (<div id={newTabStyles.wrapper}>
        <div id={newTabStyles['page-content']}>
            <NewTabMenu activeMenu={activeMenu} viewType={viewType} setActiveMenu={handleMenuElementClick} setViewType={updateViewType} searchValue={searchValue} setSearchValue={setSearchValue}/>
            {
                activeMenu === EMenuElementType.Books ?
                (
                    bIsBooksArrayEmpty ?
                    (
                        <NoResultWarning message="No books found" searchQuery={searchValue} />
                    ) : getBooksViewComponent(viewType, booksArray, booksKeys, props.callbacks.newTabBooksCallbacks)

                ) : <CategoriesPage list={props.categories} viewType={viewType} callbacks={categoriestCallbacks} searchQuery={searchValue} activeCategory={activeCategry} />
            }
        </div>
    </div>);
}

interface INewTabContentProps
{
    savedBooks: Array<IBook>;
    categories: Array<ICategory>;
    callbacks: ITabContentCallbacks;
    state: TabState;
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
