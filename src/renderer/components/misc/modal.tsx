import React, { useEffect, useState } from 'react';
import { IBookmark } from '../../../shared/schema';
import { ITOCRenderer } from '../../misc/book';
import { ICategory } from '../../misc/category';
import { TrashcanSVG, MarkSVG, CrossSVG } from '../../misc/icons';
import modalStyles from '../../styles/modules/common/modal.module.css';
import { Button } from '../common/button';

interface IBookmarkItemProps
{
    bookmark: IBookmark;
    totalNumberOfPages: number;
    scrollToPercent: (percent: number) => void;
    deleteBookmark: (id: string) => void;
    closeModal: () => void;
}

function BookmarkItem(props: IBookmarkItemProps): JSX.Element | null
{
    const [bDeleted, setDeleted] = useState(false);

    function handleJumpClick(): void
    {
        if (typeof props.closeModal === 'function')
        {
            props.closeModal();
        }

        if (typeof props.scrollToPercent === 'function')
        {
            props.scrollToPercent(props.bookmark.bookPercent);
        }
    }

    function handleDeleteClick(event: React.MouseEvent<HTMLDivElement>): void
    {
        if (event)
        {
            if (typeof props.deleteBookmark === 'function')
            {
                setDeleted(true);

                props.deleteBookmark(props.bookmark.id);
            }

            event.stopPropagation();
        }
    }

    if (bDeleted)
    {
        return null;
    }

    return (<div className={`${modalStyles['bookmark-item']}`}  onClick={handleJumpClick}>
        <div className={`${modalStyles['bookmark-item-name']}`}>
            {
                props.bookmark.text || 'Bookmark'
            }
        </div>
        <div className={modalStyles['bookmark-item-right']}>
            <div className={modalStyles['bookmark-item-page']}>
                {
                    `Page ${Math.floor(props.bookmark.pagePercent * props.totalNumberOfPages)}`
                }
            </div>
            <div className={modalStyles['bookmark-item-delete']} onClick={handleDeleteClick} title={`Delete bookmark`}>
                <CrossSVG />
            </div>
        </div>
    </div>);
}

interface IBookmarkListModal
{
    list: Array<IBookmark>;
    totalNumberOfPages: number;
    closeModal: () => void;
    scrollToPercent: (percent: number) => void;
    deleteBookmark: (id: string) => void;
}

export function BookmarkListModal(props: IBookmarkListModal): JSX.Element
{

    function deleteBookmark(id: string): void
    {
        props.deleteBookmark(id);
    }

    console.log(`Bookmarks list rendered`);
    

    return (<div id={modalStyles['bookmark-list']} className={`${modalStyles['list-modal']}`}> 
        <div id={modalStyles['bookmark-list-content']}>
            <div id={modalStyles['bookmark-list-title']}>
                {
                    `Bookmarks`
                }
            </div>
            <div id={modalStyles['bookmark-list-container']} className={`${modalStyles['list-modal-container']}`}>
                {
                    props.list.map((bookmark) =>
                    {
                        return (<BookmarkItem bookmark={bookmark} key={bookmark.id} totalNumberOfPages={props.totalNumberOfPages} scrollToPercent={props.scrollToPercent} deleteBookmark={deleteBookmark} closeModal={props.closeModal} />);
                    })
                }
            </div>
            <div id={modalStyles['bookmark-list-bottom']}>
                <Button moduleClass="grey" text="Close" onClick={props.closeModal} />
            </div>
        </div>
    </div>); 
}

interface IAddNewBookmarkModalProps
{
    closeModal: () => void;
    addBookmark: (name: string) => void;
}

export function AddNewBookmarkModal(props: IAddNewBookmarkModalProps): JSX.Element
{
    const [bookmarkName, setBookmarkName] = useState('');

    function handleInput(event: React.ChangeEvent<HTMLInputElement>): void
    {
        setBookmarkName(event.target.value);
    }

    function handleAddClick(): void
    {
        if (typeof props.closeModal === 'function')
        {
            props.closeModal();
        }

        if (typeof props.addBookmark === 'function')
        {
            props.addBookmark(bookmarkName);
        }
    }

    return (<div id={modalStyles['add-bookmark']}>
    <div id={modalStyles['add-bookmark-content']}>
        <div id={modalStyles['add-bookmark-title']}>
            {
                `Add new bookmark`
            }
        </div>
        <div id={modalStyles['add-bookmark-name']}>
            <input value={bookmarkName} placeholder={'Bookmark name'} autoFocus={true} onChange={handleInput} />
        </div>
        <div id={modalStyles['add-bookmark-bottom']}>
            <Button moduleClass="grey" text="Add bookmark" onClick={handleAddClick} />
        </div>
    </div>
</div>);
}

interface ITocItemProps
{
    name: string;
    pageNumber: number;
    percent: number;
    depth: number;
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

    classNames.push(modalStyles[`toc-item-depth-${props.depth < 5 ? props.depth : 5}`]);

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

    const tocItemsList: Array<[ITOCRenderer, number]> = [];
    const tocJsxList: Array<JSX.Element> = [];

    function flatTocArray(tocItems: Array<ITOCRenderer>, depth: number): void
    {
        for (let i = 0; i < tocItems.length; i++)
        {
            const tocItem = tocItems[i];

            tocItemsList.push([tocItem, depth]);

            if (tocItem.children && tocItem.children.length)
            {
                flatTocArray(tocItem.children, depth + 1);
            }

        }
    }

    flatTocArray(props.tocItems, 1);

    for (let i = 0; i < tocItemsList.length; i++)
    {
        const tocItem = tocItemsList[i][0];

        let bIsActiveItem = false;

        const nextTocItem = tocItemsList[i + 1] ? tocItemsList[i + 1][0] : null;

        if (tocItem.bookPercent <= props.currentScrollPercent)
        {
            if (!nextTocItem || (nextTocItem && nextTocItem.bookPercent > props.currentScrollPercent))
            {
                bIsActiveItem = true;
            }
        }

        let pageNumber = tocItem.pagesPercent !== -1 ? Math.floor(tocItem.pagesPercent * props.totalNumberOfPages) : -1;

        if (pageNumber > props.totalNumberOfPages)
        {
            pageNumber = props.totalNumberOfPages;
        }

        const tocJSX = <TableOfContentsItem name={tocItem.name} depth={tocItemsList[i][1]} pageNumber={ pageNumber } percent={tocItem.bookPercent} scrollToPercent={scrollToPercent} isActive={bIsActiveItem} key={i} />;
        tocJsxList.push(tocJSX);
    }

    useEffect(() => 
    {
        const containerElement = document.getElementById(modalStyles['toc-container']);
        if (containerElement)
        {
            const activeElement = containerElement.querySelector(`.${modalStyles['toc-item-active']}`) as HTMLElement;
            if (activeElement)
            {
                const scrollTo = Math.max(0, activeElement.offsetTop - 155 - (39 * 2));

                containerElement.scrollTo({ left: 0, top: scrollTo, behavior: 'auto'  });
            }
        }
    });

    return (<div id={modalStyles['toc']} className={`${modalStyles['list-modal']}`}>
        <div id={modalStyles['toc-content']}>
            <div id={modalStyles['toc-title']}>
                {
                    `Table of contents`
                }
            </div>
            <div id={modalStyles['toc-container']} className={`${modalStyles['list-modal-container']}`}>
                {
                    tocJsxList
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