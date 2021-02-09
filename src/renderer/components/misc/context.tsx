import React, { useEffect } from 'react';
import { IBook } from '../../misc/book';
import { BookSVG, ListSVG, TrashcanSVG } from '../../misc/icons';
import contextMenuStyles from '../../styles/modules/common/context.module.css';
import { IBookCallbacks } from '../core/book';

interface IContextMenuElementProps
{
    text: string;
    icon: typeof React.Component;
    class?: string;
    onClick?: () => void;
}

function ContextMenuElement(props: IContextMenuElementProps): JSX.Element
{
    return (<div className={`${contextMenuStyles['element']} ${props.class ? props.class : ''}`} onClick={props.onClick}>
        <props.icon />
        <div className={contextMenuStyles['element-text']}>
            {
                `${props.text}`
            }
        </div>
    </div>);
}

interface IBookContextMenuProps
{
    book: IBook;
    callbacks: IBookCallbacks;
}

export function BookContextMenu(props: IBookContextMenuProps): JSX.Element
{
    function handleDeleteClick(): void
    {
        console.log(`Delete book click`);
        if (props.callbacks && typeof props.callbacks.deleteBook === 'function')
        {
            props.callbacks.deleteBook(props.book);
        }
    }

    return (<div id={contextMenuStyles['book-context-menu']}>
        <div id={contextMenuStyles['context-container']}>
            <ContextMenuElement text={`Open`} icon={BookSVG} />
            <ContextMenuElement text={`Manage categories`} icon={ListSVG} />
            <ContextMenuElement text={`Delete`} icon={TrashcanSVG} class={contextMenuStyles[`delete-element`]}  onClick={handleDeleteClick} />
        </div>
    </div>);
}

interface IContextMenuWrapperProps
{
    /**
     * X position on the scren
     */
    x: number;
    /**
     * Y position on the screen
     */
    y: number;
    children: JSX.Element;
    removeContextMenu: () => void;
}

export function ContextMenuWrapper(props: IContextMenuWrapperProps): JSX.Element
{
    function handleBlur(): void
    {
        console.log('handleBlur context')
        if (typeof props.removeContextMenu === 'function')
        {
            props.removeContextMenu();
        }
    }

    const contextRef: React.RefObject<HTMLDivElement> = React.createRef();

    useEffect(() => 
    {
        if (contextRef && contextRef.current)
        {
            contextRef.current.focus();
        }
    }, []);
    
    return (<div tabIndex={0} id={contextMenuStyles['context-wrapper']} style={{ top: `${props.y}px`, left: `${props.x}px` }} onBlur={handleBlur} ref={contextRef} onClick={handleBlur}>
        {
            props.children
        }
    </div>);
}