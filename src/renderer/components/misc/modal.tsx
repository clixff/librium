import React, { useEffect, useState } from 'react';
import { ICategory } from '../../misc/category';
import { TrashcanSVG, MarkSVG } from '../../misc/icons';
import modalStyles from '../../styles/modules/common/modal.module.css';
import { Button } from '../common/button';

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