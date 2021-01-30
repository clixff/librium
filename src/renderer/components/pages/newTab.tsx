import React, { useState } from 'react';
import { IBook } from '../../misc/book';
import { ipcRenderer } from 'electron';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { Button } from '../common/button';
import { ListSVG, SearchSVG, GridSVG } from '../../misc/icons';
import { BooksGridView, BooksListView } from '../core/book';
import { ICategory } from '../../misc/category';
import { CategoriesList } from '../core/category';
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
                {
                    props.activeMenu === EMenuElementType.Books ?
                    (
                        <div id={newTabStyles['menu-search']}>
                            <input type="text" placeholder={`Search`} value={props.searchValue} onChange={handleSearchInput} />
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

function filterBooksBySearch(allBooks: Array<IBook>, searchQuery: string): [Array<IBook>, string]
{
    const filteredBooks: Array<IBook> = [];
    let booksKeys = '';

    for (let i = 0; i < allBooks.length; i++)
    {
        const book = allBooks[i];
        const lowerCasedTitle = book.title.trim().toLowerCase();
        let bFoundResult = false;
        if (lowerCasedTitle.includes(searchQuery))
        {
            bFoundResult = true;
        }
        else
        {
            const allBookAuthors = book.authors;
            for (let j = 0; j < allBookAuthors.length; j++)
            {
                const lowerCasedBookAuthor = allBookAuthors[j].trim().toLowerCase();
                if (lowerCasedBookAuthor.includes(searchQuery))
                {
                    bFoundResult = true;
                    break;
                }
            }
        }

        if (bFoundResult)
        {
            booksKeys += book.id;
            filteredBooks.push(book);
        }
    }

    return [filteredBooks, booksKeys];
}


function NewTabPage(props: INewTabContentProps): JSX.Element
{

    const [activeMenu, setActiveMenu] = useState(EMenuElementType.Books);
    const [viewType, setViewType] = useState(EViewType.Grid);
    const [searchValue, setSearchValue] = useState('');

    /**
     * Formatted search value
     */
    const searchQuery = searchValue.trim().toLowerCase();

    const [booksArray, bookKeys] = searchQuery ? filterBooksBySearch(props.savedBooks, searchQuery) : [props.savedBooks, 'ALL'];
    
    const bIsBooksArrayEmpty = booksArray.length === 0;

    return (<div id={newTabStyles.wrapper}>
        <div id={newTabStyles['page-content']}>
            <NewTabMenu activeMenu={activeMenu} viewType={viewType} setActiveMenu={setActiveMenu} setViewType={setViewType} searchValue={searchValue} setSearchValue={setSearchValue}/>
            {
                activeMenu === EMenuElementType.Books ?
                (
                    bIsBooksArrayEmpty ?
                    (
                        <div id={newTabStyles['no-books-warning']}>
                            {
                                searchQuery ? (
                                    <div id={newTabStyles['no-books-text']}>
                                        {
                                            `No result for "${searchValue.trim()}"`
                                        }
                                    </div>
                                ) : null
                            }
                        </div>
                    ) : (
                        viewType === EViewType.Grid ? <BooksGridView books={booksArray} keys={bookKeys}/> : <BooksListView books={booksArray} keys={bookKeys}/>
                    )

                ) : <CategoriesList list={props.categories} viewType={viewType} callbacks={props.callbacks}/>
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
