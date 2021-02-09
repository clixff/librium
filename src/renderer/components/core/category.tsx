import { ipcRenderer } from 'electron';
import React, { useState } from 'react';
import { filterBooksBySearch, IBook } from '../../misc/book';
import { filterCategoriesBySeach, generateCategoryKey, ICategory } from '../../misc/category';
import { ArrowSVG, CrossSVG, PencilSVG } from '../../misc/icons';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { Button } from '../common/button';
import { EViewType, NoResultWarning } from '../pages/newTab';
import { BooksGridView, BooksListView, BookCover, getBooksViewComponent } from './book';
import { ITabContentCallbacks } from './content';


interface ICategoryCallbacks extends ICategoriesPageCallbacks
{
    backToCategories: () => void;
}

interface ICategoryProps
{
    category: ICategory;
    viewType: EViewType;
    index: number;
    callbacks: ICategoryCallbacks;
    searchQuery: string;
}
function Category(props: ICategoryProps): JSX.Element
{
    const [categoryName, setCategoryName] = useState(props.category.name);
    const [bIsRenaming, setIsRenaming] = useState(false);

    const inputRef: React.RefObject<HTMLInputElement> = React.createRef();

    function handleRenameClick(): void
    {
        setIsRenaming(true);

        if (inputRef && inputRef.current)
        {
            inputRef.current.disabled = false;
            inputRef.current.focus();
        }
    }

    function saveCategoryName(): void
    {
        setIsRenaming(false);
        let formattedCategoryName = categoryName.trim().replace(/(\s){2,}/g, ' ');

        if (formattedCategoryName === '')
        {
            formattedCategoryName = props.category.name;
        }

        /**
         * Save the new category name to disk if it's not equal to the previous name
         */
        if (formattedCategoryName !== props.category.name)
        {
            const prevCategoryKey = props.category.key;
            props.category.key = generateCategoryKey(formattedCategoryName);
            console.log(`Renaming category`);
            ipcRenderer.send('update-category-name', prevCategoryKey, formattedCategoryName, props.category.key);
        }

        if (formattedCategoryName !== categoryName)
        {
            setCategoryName(formattedCategoryName);
        }
        props.category.name = formattedCategoryName;
    }

    function handleSaveNameClick(): void
    {
        saveCategoryName();
    }

    function handleInputKeyUp(event: React.KeyboardEvent<HTMLInputElement>): void
    {
        if (event.key === 'Enter')
        {
            saveCategoryName();
        }
    }

    function handleNameChange(event: React.ChangeEvent<HTMLInputElement>): void
    {
        if (!bIsRenaming)
        {
            return;
        }

        const categoryName = event.target.value;
        setCategoryName(categoryName);
    }

    function handleBackButtonClick(): void
    {
        if (typeof props.callbacks.clearSearchQuery === 'function')
        {
            props.callbacks.clearSearchQuery();
        }

        if (typeof props.callbacks.backToCategories === 'function')
        {
            props.callbacks.backToCategories();
        }
    }

    function handleDeleteButtonClick(): void
    {
        if (typeof props.callbacks.onCategoryDelete === 'function')
        {
            props.callbacks.onCategoryDelete(props.index);
        }

        handleBackButtonClick();
    }

    const searchQuery = props.searchQuery.toLowerCase().trim();
    const [booksList, booksKeys] = searchQuery ? filterBooksBySearch(props.category.books, searchQuery) : [props.category.books, 'ALL'];

    const bCategoryIsEmpty = booksList.length === 0;

    return (<div id={newTabStyles['category-wrapper']}>
        <div id={newTabStyles['category-header']}>
            <div id={newTabStyles['category-header-left']}>
                <div id={newTabStyles['category-back-button']} onClick={handleBackButtonClick}>
                    <ArrowSVG />
                </div>
                <input type="text" id={newTabStyles['category-name']} value={categoryName} onChange={handleNameChange} placeholder={`${'Category name'}`} disabled={!bIsRenaming} ref={inputRef} onKeyUp={handleInputKeyUp} title={categoryName} />
            </div>
            <div id={newTabStyles['category-header-right']}>
                {
                    bIsRenaming ?
                    (<Button text={'Save'} moduleClass="grey" onClick={handleSaveNameClick} />) :
                    (
                        <React.Fragment>
                            <Button moduleClass="grey" title={`Rename category`} onClick={handleRenameClick} >
                                <React.Fragment>
                                    <PencilSVG />
                                    <div>
                                        {'Rename'}
                                    </div>
                                </React.Fragment>
                            </Button>
                            <Button moduleClass="red" title={`Delete category`} onClick={handleDeleteButtonClick} >
                                <React.Fragment>
                                    <CrossSVG />
                                    <div>
                                        {'Delete'}
                                    </div>
                                </React.Fragment>
                            </Button>
                        </React.Fragment>
                    )
                }
            </div>
        </div>
        {
            bCategoryIsEmpty ?
                <NoResultWarning message="No books found" searchQuery={props.searchQuery} />
            : getBooksViewComponent(props.viewType, booksList, booksKeys, props.callbacks.newTabBooksCallbacks)
        }
    </div>);
}

interface ICategoriesListElementProps
{
    category: ICategory;
    index: number;
    callbacks: ICategoriesListCallbacks;
}

/**
 * Rendered by Categories List
 */
function CategoriesListElement(props: ICategoriesListElementProps): JSX.Element
{
    /**
     * First book in the category, used as cover
     */
    const firstBook: IBook | undefined = props.category.books[0];

    function handleDeleteClick(event: React.MouseEvent<HTMLDivElement>): void
    {
        if (typeof props.callbacks.onCategoryDelete === 'function')
        {
            props.callbacks.onCategoryDelete(props.index);
        }
        event.stopPropagation();
    }
    
    function handleElementClick(): void
    {
        if (typeof props.callbacks.clearSearchQuery === 'function')
        {
            props.callbacks.clearSearchQuery();
        }

        if (typeof props.callbacks.onCategoryClick === 'function')
        {
            props.callbacks.onCategoryClick(props.index);
        }
    }

    return (<div className={newTabStyles['categories-list-element']} onClick={handleElementClick} >
        <div className={newTabStyles['categories-element-cover']}>
            {
                firstBook ?
                (
                    <BookCover cover={firstBook.cover} id={firstBook.id} title={firstBook.title} author={firstBook.authors[0]} />
                ) : null
            }
        </div>
        <div className={newTabStyles['categories-element-data']}>
            <div className={newTabStyles['categories-element-name']} title={props.category.name}>
                {
                    props.category.name
                }
            </div>
            <div className={newTabStyles['categories-element-number']}>
                {
                    `${`Books`}: ${props.category.books.length}`
                }
            </div>
        </div>
        <div className={newTabStyles['categories-element-delete']} title={`Delete category`} onClick={handleDeleteClick} >
            <CrossSVG />
        </div>
    </div>);
}

interface ICategoriesListCallbacks extends ICategoriesPageCallbacks
{
    onCategoryClick: (id: number) => void;
}

interface ICategoriesListProps extends ICategoriesPageProps
{
    callbacks: ICategoriesListCallbacks;
    keys: string;
}

const CategoriesList = React.memo((props: ICategoriesListProps): JSX.Element =>
{
    const bIsCategoriesArrayEmpty = props.list.length === 0;

    if (bIsCategoriesArrayEmpty)
    {
        return (<NoResultWarning message="No categories found" searchQuery={props.searchQuery} />);
    }

    return (<div id={newTabStyles['categories-container']}>
        {
            props.list.map((category, index) =>
            {
                return (<CategoriesListElement category={category} key={category.key} index={index} callbacks={props.callbacks} />);
            })
        }
    </div>);
}, (prevProps, nextProps) =>
{
    if (nextProps.keys === 'ALL' && nextProps.searchQuery === '')
    {
        return false;
    }

    if (prevProps.searchQuery !== nextProps.searchQuery && prevProps.list.length === 0)
    {
        return false;
    }

    return prevProps.keys === nextProps.keys && prevProps.list.length === nextProps.list.length;
});

export interface ICategoriesPageCallbacks extends ITabContentCallbacks
{
    clearSearchQuery: () => void;
    setActiveCategory: (id: number) => void;
}

interface ICategoriesPageProps
{
    list: Array<ICategory>;
    viewType: EViewType;
    callbacks: ICategoriesPageCallbacks;
    searchQuery: string;
    activeCategory: number;
}

enum ECategoryPageContent
{
    list,
    category
}

export function CategoriesPage(props: ICategoriesPageProps): JSX.Element
{    
    function backToCategoriesList(): void
    {
        props.callbacks.setActiveCategory(-1);
    }

    const categoryCallbacks: ICategoryCallbacks = {
        ...props.callbacks,
        backToCategories: backToCategoriesList
    };

    const categoriesListCallbacks: ICategoriesListCallbacks =
    {
        ...props.callbacks,
        onCategoryClick: props.callbacks.setActiveCategory
    };

    const activeContent: ECategoryPageContent = props.activeCategory === -1 ? ECategoryPageContent.list : ECategoryPageContent.category;

    let categoriesArray: Array<ICategory> = props.list;
    let categoriesListKeys = 'ALL';

    if (activeContent === ECategoryPageContent.list)
    {
        const searchResult = filterCategoriesBySeach(categoriesArray, props.searchQuery);
        categoriesArray = searchResult.list;
        categoriesListKeys = searchResult.keys;
    }

    return (<div id={newTabStyles['categories-page']}>
        {
            activeContent === ECategoryPageContent.category ?
            (
                <Category category={props.list[props.activeCategory]} callbacks={categoryCallbacks} index={props.activeCategory} viewType={props.viewType} searchQuery={props.searchQuery} />
            ) : <CategoriesList {...props} callbacks={categoriesListCallbacks} list={categoriesArray} keys={categoriesListKeys} />
        }
    </div>);
}