import React, { ChangeEvent, useState } from 'react';
import { ICategory } from '../../misc/category';
import { ArrowSVG, CrossSVG } from '../../misc/icons';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { EViewType } from '../pages/newTab';
import { BooksGridView, BooksListView } from './book';
import { IAppContentCallbacks } from './content';

interface ICategoryProps
{
    category: ICategory;
    viewType: EViewType;
    index: number;
    callbacks: IAppContentCallbacks;
}

export function Category(props: ICategoryProps): JSX.Element
{
    const [bVisible, setVisible] = useState(false);

    const [categoryName, _setCategoryName] = useState(props.category.name);

    function setCategoryName(name: string)
    {
        _setCategoryName(name);
        props.category.name = name;
    }

    function handleChangeName(event: ChangeEvent<HTMLInputElement>): void
    {
        const name: string = event.target.value;
        setCategoryName(name);
    }

    function handleBlurName(): void
    {
        const formattedCategoryName = categoryName.trim();
        if (formattedCategoryName !== categoryName)
        {
            setCategoryName(formattedCategoryName);
        }
    }

    function handleCategoryHideClick(): void
    {
        setVisible(!bVisible);
    }

    function handleDeleteButtonClick(): void
    {
        if (props.callbacks && typeof props.callbacks.onCategoryDelete === 'function')
        {
            props.callbacks.onCategoryDelete(props.index);
        }
    }

    return (<div className={newTabStyles['category-wrapper']}>
        <div className={newTabStyles['category-header']}>
            <div className={`${newTabStyles['category-button']} ${newTabStyles['category-hide-button']}`} onClick={handleCategoryHideClick}>
                <ArrowSVG style={ { transform: `rotate(${bVisible ? 90 : 0 }deg)` } } />
            </div>

            <input type="text" value={categoryName} onChange={handleChangeName} className={newTabStyles['category-name']} onBlur={handleBlurName}/>

            <div className={`${newTabStyles['category-button']} ${newTabStyles['category-delete-button']}`} title={`Delete category`} onClick={handleDeleteButtonClick}>
                <CrossSVG />
            </div>
        </div>
        {
            bVisible ? (
                props.viewType === EViewType.Grid ? <BooksGridView books={props.category.books} keys="" /> : <BooksListView books={props.category.books} keys="" />
            ) : null 
        }
    </div>);
}

interface ICategoriesListProps
{
    list: Array<ICategory>;
    viewType: EViewType;
    callbacks: IAppContentCallbacks;
}

export function CategoriesList(props: ICategoriesListProps): JSX.Element
{
    return (<div id={newTabStyles['categories-container']}>
        {
            props.list.map((category, index) =>
            {
                return (<Category category={category} key={category.key} viewType={props.viewType} index={index} callbacks={props.callbacks}/>);
            })
        }
    </div>);
}