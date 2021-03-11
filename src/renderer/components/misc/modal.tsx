import React, { useEffect, useState } from 'react';
import { ITOCRenderer } from '../../misc/book';
import { ICategory } from '../../misc/category';
import { TrashcanSVG, MarkSVG } from '../../misc/icons';
import modalStyles from '../../styles/modules/common/modal.module.css';
import { Button } from '../common/button';

interface ITocItemProps
{
    name: string;
    pageNumber: number;
    percent: number;
    row: number;
    isActive: boolean;
    scrollToPercent: ((percent: number) => void);
}

function TableOfContentsItem(props: ITocItemProps): JSX.Element
{
    function handleClick(): void
    {
        props.scrollToPercent(props.percent);
    }

    const classNames = [modalStyles['toc-item']];

    classNames.push(modalStyles[`toc-item-row-${props.row < 5 ? props.row : 5}`]);

    if (props.isActive)
    {
        classNames.push(modalStyles['toc-item-active']);
    }

    return (<div className={classNames.join(' ')} onClick={handleClick}>
        <div className={modalStyles['toc-item-name']}>
            {
                props.name
            }
        </div>
        <div className={modalStyles['toc-item-page']}>
            {
                props.pageNumber !== -1 ? props.pageNumber : ''
            }
        </div>
    </div>);
}

interface ITocMenuProps
{
    tocItems: Array<ITOCRenderer>;
    scrollToPercent: ((percent: number) => void) | null;
    currentScrollPercent: number;
    totalNumberOfPages: number;
    closeModal: () => void;
}

export function TableOfContentsMenu(props: ITocMenuProps): JSX.Element
{

    function scrollToPercent(percent: number): void
    {
        if (percent !== -1)
        {
            if (typeof props.closeModal === 'function')
            {
                props.closeModal();
            }

            if (typeof props.scrollToPercent === 'function')
            {
                props.scrollToPercent(percent);
            }
        }
    }

    const tableOfContentsItems: Array<JSX.Element> = [];

    function tocItemsToJSX(tocItems: Array<ITOCRenderer>, row: number): void
    {
        for (let i = 0; i < tocItems.length; i++)
        {
            const tocItem = tocItems[i];

            const nextTocItem = tocItem.children && tocItem.children.length ?  tocItem.children[0] : tocItems[i + 1];

            const bIsActiveItem = false;

            if (tocItem.bookPercent <= props.currentScrollPercent)
            {
                if (!nextTocItem || (nextTocItem && nextTocItem.bookPercent > props.currentScrollPercent))
                {
                    // bIsActiveItem = true;
                }
            }

            const tocJSX = <TableOfContentsItem name={tocItem.name} row={row} pageNumber={ tocItem.pagesPercent !== -1 ? Math.floor(tocItem.pagesPercent * props.totalNumberOfPages) : -1 } percent={tocItem.bookPercent} scrollToPercent={scrollToPercent} isActive={bIsActiveItem} key={tableOfContentsItems.length} />;
            tableOfContentsItems.push(tocJSX);
            if (tocItem.children && tocItem.children.length)
            {
                tocItemsToJSX(tocItem.children, row + 1);
            }

        }
    }

    tocItemsToJSX(props.tocItems, 1);

    return (<div id={modalStyles['toc']}>
        <div id={modalStyles['toc-content']}>
            <div id={modalStyles['toc-title']}>
                {
                    `Table of contents`
                }
            </div>
            <div id={modalStyles['toc-container']}>
                {
                    tableOfContentsItems
                }
            </div>
            <div id={modalStyles['toc-bottom']}>
                <Button moduleClass="grey" text="Close" onClick={props.closeModal} />
            </div>
        </div>
    </div>);
}

export interface IManageCategoriesItem
{
    category: ICategory;
    isActive: boolean;
}


export enum EManageCategoriesEventType
{
    /**
     * Delete book from the category
     */
    Delete,
    /**
     * Add book to the category
     */
    Add
}

interface IManageCategoriesItemProps
{
    element: IManageCategoriesItem;
    onManageCategoriesEvent: (category: ICategory, type: EManageCategoriesEventType) => void;
}

function ManageCategoriesItem(props: IManageCategoriesItemProps): JSX.Element
{
    const [bIsActive, setIsActive] = useState(props.element.isActive);

    function handleItemClick(): void
    {
        const bIsAddedToCategory = !bIsActive;
        setIsActive(bIsAddedToCategory);

        if (typeof props.onManageCategoriesEvent === 'function')
        {
            props.onManageCategoriesEvent(props.element.category, bIsAddedToCategory ? EManageCategoriesEventType.Add : EManageCategoriesEventType.Delete);
        }
    }

    return (<div className={`${modalStyles['manage-categories-item']} ${bIsActive ? modalStyles['manage-categories-item-active'] : ''}`} onClick={handleItemClick}>
        <div className={modalStyles['manage-categories-item-name']}>
            {
                props.element.category.name
            }
        </div>
        <div className={modalStyles['manage-categories-item-checkbox']}>
            {
                bIsActive ? <MarkSVG /> : null
            }
        </div>
    </div>);
}

interface IManageCategoriesMenuProps
{
    categories: Array<IManageCategoriesItem>;
    onManageCategoriesEvent: (category: ICategory, type: EManageCategoriesEventType) => void;
    closeModal: () => void;
}

export function ManageCategoriesMenu(props: IManageCategoriesMenuProps): JSX.Element
{
    /**
     * If there are more than 5 items in the container, a scrollbar appears,
     * so we need to add margin-right to all items
     */
    const maxVisibleItems = 5;
    const bIsContainerFull = props.categories.length > maxVisibleItems;
    const containerClass = bIsContainerFull ? modalStyles['manage-categories-container-full'] : '';

    return (<div id={modalStyles['manage-categories']}>
        <div id={modalStyles['manage-categories-content']}>
            <div id={modalStyles['manage-categories-title']}>
                {
                    `Book Categories`
                }
            </div>
            <div id={modalStyles['manage-categories-container']} className={containerClass}>
                {
                    props.categories.map((element, index) => 
                    {
                        return (<ManageCategoriesItem element={element} key={index} onManageCategoriesEvent={props.onManageCategoriesEvent} />);
                    })
                }
            </div>
            <div id={modalStyles['manage-categories-bottom']}>
                <Button moduleClass="grey" text="Close" onClick={props.closeModal} />
            </div>
        </div>
    </div>);
}

interface IDeletionWarningModalProps
{
    text: string;
    onDeleteClick: () => void;
    closeModal: () => void;
}

export function DeletionWarningModal(props: IDeletionWarningModalProps): JSX.Element
{
    function handleDeleteClick(): void
    {
        if (typeof props.onDeleteClick === 'function')
        {
            props.onDeleteClick();
        }

        if (typeof props.closeModal === 'function')
        {
            props.closeModal();
        }
    }

    function handleCancelClick(): void
    {
        if (typeof props.closeModal === 'function')
        {
            props.closeModal();
        }
    }

    return (<div id={modalStyles['deletion-warning']}>
        <div id={modalStyles['deletion-warning-container']}>
            <TrashcanSVG />
            <div id={modalStyles['deletion-warning-text']}>
                {
                    props.text
                }
            </div>
            <div id={modalStyles['deletion-warning-buttons']}>
                <Button text={`Delete`} class={modalStyles['delete-button']} moduleClass="red" onClick={handleDeleteClick} />
                <Button text={`Cancel`} class={modalStyles['deletion-cancel-button']} moduleClass={'grey'} onClick={handleCancelClick}/>
            </div>
        </div>
    </div>);
}


interface IModalWrapperProps
{
    closeModal: () => void;
    isClosing: boolean;
    children: JSX.Element;
}

export function ModalWrapper(props: IModalWrapperProps): JSX.Element
{
    function closeModal(): void
    {
        if (props.isClosing)
        {
            return;
        }

        if (typeof props.closeModal === 'function')
        {
            props.closeModal();
        }
    }

    function handleKeyUp(event: KeyboardEvent): void
    {
        if (event.key === 'Escape')
        {
            closeModal();
        }
    }

    useEffect(() =>
    {
        window.addEventListener('keyup', handleKeyUp);

        return (() => 
        {
            window.removeEventListener('keyup', handleKeyUp);
        });
    }, []);

    return (<div id={modalStyles['wrapper']} className={`${props.isClosing ? modalStyles['wrapper-closing'] : ''}`}>
        <div id={modalStyles['background']} onClick={closeModal} />
        {
            props.children
        }
    </div>);
}

export interface IModalData
{
    element: JSX.Element | null;
    createdAt: number;
    isClosing: boolean;
}