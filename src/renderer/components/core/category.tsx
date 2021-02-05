import React, { ChangeEvent, useState } from 'react';
import { IBook } from '../../misc/book';
import { ICategory } from '../../misc/category';
import { ArrowSVG, CrossSVG, PencilSVG } from '../../misc/icons';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { Button } from '../common/button';
import { EViewType } from '../pages/newTab';
import { BooksGridView, BooksListView, BookCover } from './book';
import { IAppContentCallbacks } from './content';


interface ICategoryCallbacks extends IAppContentCallbacks
{
    backToCategories: () => void;
}


interface ICategoryProps
{
    category: ICategory;
    viewType: EViewType;
    index: number;
    callbacks: ICategoryCallbacks;
}
function Category(props: ICategoryProps): JSX.Element
{
    const [categoryName, setCategoryName] = useState(props.category.name);
    const [bIsRenaming, setIsRenaming] = useState(false);

    const inputRef: React.RefObject<HTMLInputElement> = React.createRef();

    function handleRenameClick(): void
    {
        setIsRenaming(true);

        console.log(`Input ref is `, inputRef);

        if (inputRef && inputRef.current)
        {
            inputRef.current.disabled = false;
            inputRef.current.focus();
        }
    }

    function handleSaveNameClick(): void
    {
        setIsRenaming(false);
        const formattedCategoryName = categoryName.trim().replace(/(\s){2,}/g, ' ');
        if (formattedCategoryName !== categoryName)
        {
            setCategoryName(formattedCategoryName);
        }
        props.category.name = formattedCategoryName;
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

    return (<div id={newTabStyles['category-wrapper']}>
        <div id={newTabStyles['category-header']}>
            <div id={newTabStyles['category-header-left']}>
                <div id={newTabStyles['category-back-button']} onClick={handleBackButtonClick}>
                    <ArrowSVG />
                </div>
                <input type="text" id={newTabStyles['category-name']} className={`${bIsRenaming ? '' : newTabStyles['category-name-disabled'] }`} value={categoryName} onChange={handleNameChange} placeholder={`${'Category name'}`} disabled={!bIsRenaming} ref={inputRef} />
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
        <div className={newTabStyles['categoriest-element-data']}>
            <div className={newTabStyles['categories-element-name']}>
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

interface ICategoriesListCallbacks extends IAppContentCallbacks
{
    onCategoryClick: (id: number) => void;
}

interface ICategoriesListProps extends ICategoriesPageProps
{
    callbacks: ICategoriesListCallbacks;
}

function CategoriesList(props: ICategoriesListProps): JSX.Element
{
    return (<div id={newTabStyles['categories-container']}>
        {
            props.list.map((category, index) =>
            {
                return (<CategoriesListElement category={category} key={category.key} index={index} callbacks={props.callbacks} />);
            })
        }
    </div>);
}

interface ICategoriesPageProps
{
    list: Array<ICategory>;
    viewType: EViewType;
    callbacks: IAppContentCallbacks;
}

export function CategoriesPage(props: ICategoriesPageProps): JSX.Element
{
    const [activeCategory, setActiveCategory] = useState(-1);
    
    function backToCategoriestList(): void
    {
        setActiveCategory(-1);
    }

    const categoryCallbacks: ICategoryCallbacks = {
        ...props.callbacks,
        backToCategories: backToCategoriestList
    };

    const categoriestListCallbacks: ICategoriesListCallbacks =
    {
        ...props.callbacks,
        onCategoryClick: setActiveCategory
    };

    return (<div id={newTabStyles['categories-page']}>
        {
            activeCategory !== -1 ?
            (
                <Category category={props.list[activeCategory]} callbacks={categoryCallbacks} index={activeCategory} viewType={props.viewType} />
            ) : <CategoriesList {...props} callbacks={categoriestListCallbacks} />
        }
    </div>);
}