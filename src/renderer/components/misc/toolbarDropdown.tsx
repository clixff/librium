import React, { useEffect } from 'react';
import { IPreferences } from '../../../shared/preferences';
import { AppSingleton } from '../../app';
import { CloseTitlebarSVG, ListSVG } from '../../misc/icons';
import toolbarDropdownStyles from '../../styles/modules/common/toolbarDropdown.module.css';
import { ToolbarDropdownSettingsContainer } from '../core/preferences';
interface IToolbarDropdownProps
{
    rightOffset: number;
    children: JSX.Element;
    isFullScreen: boolean;
    closeDropdown: () => void;
}


export function ToolbarDropdownWrapper(props: IToolbarDropdownProps): JSX.Element
{


    useEffect(() => 
    {
        const wrapperElement = document.getElementById(toolbarDropdownStyles.wrapper);
        if (wrapperElement)
        {
            wrapperElement.focus();
        }

        document.body.addEventListener('click', handleDocumentClick);

        return (() =>
        {
            document.body.removeEventListener('click', handleDocumentClick);
        });

    }, []);

    function closeDropdown(): void
    {
        if (typeof props.closeDropdown === 'function')
        {
            props.closeDropdown();
        } 
    }

    function handleDocumentClick(event: MouseEvent): void
    {
        
        const wrapperElement = document.getElementById(toolbarDropdownStyles.wrapper);

        if (!wrapperElement || !event.target)
        {
            closeDropdown();
            return;
        }

        const bClickedInsideWrapper = wrapperElement.contains(event.target as Node);

        if (!bClickedInsideWrapper)
        {
            const allToolbarButtonsWithDropdown = document.getElementsByClassName('toolbar-button-with-dropdown');
            let bClickedOnToolbarButtonWithDropdown = false;

            if (allToolbarButtonsWithDropdown.length)
            {
                for (let i = 0; i < allToolbarButtonsWithDropdown.length; i++)
                {
                    const buttonElement = allToolbarButtonsWithDropdown[i];

                    if (buttonElement.contains(event.target as Node))
                    {
                        bClickedOnToolbarButtonWithDropdown = true;
                        break;
                    }
                }
            }

            if (!bClickedOnToolbarButtonWithDropdown)
            {
                closeDropdown();
            }
        }
    }


    return (<div tabIndex={0} id={toolbarDropdownStyles.wrapper} className={`${props.isFullScreen ? toolbarDropdownStyles.fullscreen : ''}`} style={
        {
            right: `${props.rightOffset}px`
        }
    }>
        {
            props.children
        }
    </div>);
}

interface IToolbarDropdownSettingsProps
{
    preferences: IPreferences;
}

export function ToolbarDropdownSettings(props: IToolbarDropdownSettingsProps): JSX.Element
{
    return (<div className={`${toolbarDropdownStyles.settings}`}>
        <ToolbarDropdownSettingsContainer preferences={props.preferences}  />
    </div>);
}


interface IBookmarkMenuButtonProps
{
    icon: typeof React.Component;
    text: string;
    onClick?: () => void;
}

function BookmarkMenuButton(props: IBookmarkMenuButtonProps): JSX.Element
{
    function handleClick(): void
    {
        if (typeof props.onClick === 'function')
        {
            props.onClick();
        }
    }

    return (<div className={`${toolbarDropdownStyles['bookmark-button']}`} onClick={handleClick}>
        <div className={`${toolbarDropdownStyles['bookmark-button-icon']}`}>
            <props.icon />
        </div>
        <div className={`${toolbarDropdownStyles['bookmark-button-text']}`}>
            {
                props.text
            }
        </div>
    </div>);
}

interface IToolbarDropdownBookmarksProps
{
    closeDropdown: () => void;
}

export function ToolbarDropdownBookmarks(props: IToolbarDropdownBookmarksProps): JSX.Element
{

    function handleAddNewClick(): void
    {
        if (typeof props.closeDropdown === 'function')
        {
            props.closeDropdown();
        }

        if (AppSingleton)
        {
            AppSingleton.openNewBookmarkModal();
        }
    }

    function handleViewAllClick(): void
    {
        if (typeof props.closeDropdown === 'function')
        {
            props.closeDropdown();
        }

        if (AppSingleton)
        {
            AppSingleton.openBookmarkListModal();
        }
    }

    return (<div className={`${toolbarDropdownStyles.bookmarks}`}>
        <BookmarkMenuButton icon={CloseTitlebarSVG} text="Add new bookmark" onClick={handleAddNewClick} />
        <BookmarkMenuButton icon={ListSVG} text="View all bookmarks" onClick={handleViewAllClick} />
    </div>);
}