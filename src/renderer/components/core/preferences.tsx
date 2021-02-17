import { ipcRenderer } from 'electron';
import React, { useState } from 'react';
import { EColorTheme, IPreferences } from '../../../shared/preferences';
import { ArrowSVG } from '../../misc/icons';
import preferencesStyles from '../../styles/modules/preferences.module.css';


interface IDropdownSettingOptionProps
{
    name: string;
    index: number;
    isActive: boolean;
    onSelect: (id: number) => void;
}

function DropdownSettingOption(props: IDropdownSettingOptionProps): JSX.Element
{
    function handleSelect(): void
    {
        if (typeof props.onSelect === 'function')
        {
            props.onSelect(props.index);
        }
    }

    return (<div className={`${preferencesStyles['dropdown-option']} ${props.isActive ? preferencesStyles['dropdown-active-option'] : '' }`} onClick={handleSelect}>
        {
            props.name
        }
    </div>);
}

interface IDropdownSettingProps
{
    /**
     * Setting ID
     */
    id: string;
    name: string;
    options: Array<string>;
    activeOption: number;
    onChange?: (id: string, option: number) => void;
}

function DropdownSetting(props: IDropdownSettingProps): JSX.Element
{
    const [activeOptionIndex, setActiveOption] = useState(props.activeOption);
    const [bRenderAllOptions, setRenderOptions] = useState(false);

    const activeOption: string = props.options[activeOptionIndex] || props.options[0];

    function handleBlur(): void
    {
        setRenderOptions(false);
    }

    function handleSelectOption(optionId: number): void
    {
        if (optionId < 0)
        {
            optionId = 0;
        }
        else if (optionId >= props.options.length)
        {
            optionId = props.options.length - 1;
        }

        if (optionId === activeOptionIndex)
        {
            return;
        }

        setActiveOption(optionId);
        if (typeof props.onChange === 'function')
        {
            props.onChange(props.id, optionId);
        }
    }

    function handleClick(): void
    {
        setRenderOptions(!bRenderAllOptions);
    }

    return (<div className={`${preferencesStyles['setting']}`}>
        <SettingName name={props.name} />
        <div className={preferencesStyles['dropdown-wrapper']} tabIndex={0} onBlur={handleBlur} onClick={handleClick}>
            <div className={preferencesStyles['dropdown-selected']}>
                <div className={preferencesStyles['dropdown-selected-name']}>
                    {
                        activeOption
                    }
                </div>
                <ArrowSVG />
            </div>
            {
                bRenderAllOptions ? 
                (<div className={preferencesStyles['dropdown-container']}> 
                    {
                        props.options.map((value, index) => 
                        {
                            return (<DropdownSettingOption name={value} index={index} isActive={index === activeOptionIndex} key={index} onSelect={handleSelectOption} />);
                        })
                    }
                </div>) : null
            }
        </div>
    </div>);
}

interface ISettingNameProps
{
    name: string;
}

function SettingName(props: ISettingNameProps): JSX.Element
{
    return (<div className={preferencesStyles['setting-name']}>
        {
            `${props.name}`
        }
    </div>);
}

export interface IPreferencesCallbacks
{
    changeSetting: (id: string, value: unknown) => void; 
}

export interface IPreferencesPageProps
{
    preferences: IPreferences;
    callbacks: IPreferencesCallbacks;
}


export function PreferencesPage(props: IPreferencesPageProps): JSX.Element
{
    function handleColorThemeChange(id: string, option: number): void
    {
        let colorTheme: EColorTheme = option;
        if (colorTheme !== EColorTheme.Dark)
        {
            colorTheme = EColorTheme.Light;
        }

        changeColorTheme(colorTheme);

        onSettingChange(id, option);
    }

    function onSettingChange(id: string, value: unknown): void
    {
        if (typeof props.callbacks.changeSetting === 'function')
        {
            props.callbacks.changeSetting(id, value);
        }
    }

    return (<div id={preferencesStyles.wrapper}>
        <div id={preferencesStyles['page-content']}>
            <h1 id={preferencesStyles['page-title']}>
                Preferences
            </h1>
            <div id={preferencesStyles.container}>
                <DropdownSetting id="colorTheme" name="Color Theme" options={['Dark', 'Light']} activeOption={props.preferences.colorTheme} onChange={handleColorThemeChange} />
            </div>
        </div>
    </div>);
}


export function changeColorTheme(colorTheme: EColorTheme): void
{
    if (colorTheme === EColorTheme.Dark)
    {
        document.body.classList.remove('light');
    }
    else
    {
        document.body.classList.add('light');
    }
}

/**
 * 
 * @param id Setting ID
 */
export function changeSetting(preferences: IPreferences, id: string, value: unknown): void
{
    const preferencesRecord: Record<string, unknown> = preferences as unknown as Record<string, unknown>;
    preferencesRecord[id] = value;
    ipcRenderer.send('setting-changed', id, value);

}