import React, { useEffect } from 'react';
import { BookSVG, ListSVG, TrashcanSVG } from '../../misc/icons';
import contextMenuStyles from '../../styles/modules/common/context.module.css';

interface IContextMenuElementProps
{
    text: string;
    icon: typeof React.Component;
    class?: string;
}

function ContextMenuElement(props: IContextMenuElementProps): JSX.Element
{
    return (<div className={`${contextMenuStyles['element']} ${props.class ? props.class : ''}`}>
        <props.icon />
        <div className={contextMenuStyles['element-text']}>
            {
                `${props.text}`
            }
        </div>
    </div>);
}

export function BookContextMenu(): JSX.Element
{
    return (<div id={contextMenuStyles['book-context-menu']}>
        <div id={contextMenuStyles['context-container']}>
            <ContextMenuElement text={`Open`} icon={BookSVG} />
            <ContextMenuElement text={`Manage categories`} icon={ListSVG} />
            <ContextMenuElement text={`Delete`} icon={TrashcanSVG} class={contextMenuStyles[`delete-element`]} />
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