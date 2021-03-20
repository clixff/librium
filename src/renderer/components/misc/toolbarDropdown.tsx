import React, { useEffect } from 'react';
import { IPreferences } from '../../../shared/preferences';
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

    function handleBlur(): void
    {
        // closeDropdown();
    }

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
            closeDropdown();
        }
    }


    return (<div tabIndex={0} id={toolbarDropdownStyles.wrapper} className={`${props.isFullScreen ? toolbarDropdownStyles.fullscreen : ''}`} style={
        {
            right: `${props.rightOffset}px`
        }
    } onBlur={handleBlur}>
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