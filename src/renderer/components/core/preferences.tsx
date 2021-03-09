import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import { EBrowseType, EColorTheme, IBrowseFileFilter, IPreferences } from '../../../shared/preferences';
import { ArrowSVG, MarkSVG } from '../../misc/icons';
import { maxBookFontSize, minBookFontSize, updateBookFontFamily, updateBookFontSize } from '../../misc/preferences';
import preferencesStyles from '../../styles/modules/preferences.module.css';
import { Button } from '../common/button';

interface ICheckboxSetting
{
    id: string;
    name: string;
    value: boolean;
    onChange: (id: string, value: boolean) => void;
}

function CheckboxSetting(props: ICheckboxSetting): JSX.Element
{
    const [value, setValue] = useState(props.value);

    function handleClick(): void
    {
        setValue(!value);
        if (typeof props.onChange === 'function')
        {
            props.onChange(props.id, !value);
        }
    }

    return (<div className={preferencesStyles.setting}>
        <SettingName name={props.name} />
        <div className={`${preferencesStyles['checkbox']} ${value ? preferencesStyles['checkbox-checked'] : '' }`} onClick={handleClick}>
            {
                value ? 
                (
                    <MarkSVG />
                ) : null
            }
        </div>
    </div>);
}

const sliderSaveTimeouts: Map<string, number> = new Map();
const cachedSliderValues: Map<string, number> = new Map();

interface ISliderSettingProps
{
    id: string;
    name: string;
    value: number;
    min: number;
    max: number;
    onChange: (id: string, value: number) => void;
}

function SilderSetting(props: ISliderSettingProps): JSX.Element
{
    const maxSliderValue = 1000;

    const [value, _setValue] = useState(props.value);
    const [renderValue, setRenderValue] = useState(`${props.value}`);
    const [sliderValue, setSliderValue] = useState(getSliderValue(props.value));

    function getValue(): number | undefined
    {
        return cachedSliderValues.get(props.id);
    }

    function setValue(newValue: number): void
    {
        _setValue(newValue);

        cachedSliderValues.set(props.id, newValue);
    }

    useEffect(() => 
    {
        return (() => 
        {
            const sliderValue = getValue();

            if (sliderValue === undefined)
            {
                return;
            }

            const oldSaveTimeout = sliderSaveTimeouts.get(props.id);
            if (oldSaveTimeout)
            {
                window.clearTimeout(oldSaveTimeout);
                sliderSaveTimeouts.delete(props.id);
                saveValue(sliderValue);
            }

            cachedSliderValues.delete(props.id);
        });
    }, []);

    function getSliderValue(value: number): number
    {
        let sliderValue = Math.floor(((value - props.min) / (props.max - props.min)) * maxSliderValue);
        if (sliderValue > maxSliderValue)
        {
            sliderValue = maxSliderValue;
        }
        else if (sliderValue < 0)
        {
            sliderValue = 0;
        }
    
        return sliderValue;
    }

    function handleChangeSlider(event: React.ChangeEvent<HTMLInputElement>): void
    {
        const newSliderValue = Number(event.target.value);
        if (isFinite(newSliderValue))
        {
            const sliderPercent = newSliderValue / maxSliderValue;

            const newValue = Math.round(props.min + ((props.max - props.min) * sliderPercent));

            setValue(newValue);
            setRenderValue(`${newValue}`);
            setSliderValue(newSliderValue);
            saveValueWithTimer(newValue);
        }
    }

    function handleTextChange(event: React.ChangeEvent<HTMLInputElement>): void
    {
        const value = event.target.value;
        const parsedValue = Number(value);

        if (value !== '' && !isFinite(parsedValue))
        {
            return;
        }

        setValue(parsedValue);
        setRenderValue(value);
        setSliderValue(getSliderValue(parsedValue));
    }
    
    function handleBlur(): void
    {
        let newValue = Math.floor(value);
        if (newValue < props.min)
        {
            newValue = props.min;
        }
        else if (newValue > props.max)
        {
            newValue = props.max;
        }
        else if (!isFinite(newValue))
        {
            newValue = props.min;
        }

        setValue(newValue);
        setRenderValue(`${newValue}`);
        setSliderValue(getSliderValue(newValue));
        saveValue(newValue);
    }

    function saveValueWithTimer(value: number): void
    {
        const oldTimeout = sliderSaveTimeouts.get(props.id);
        if (oldTimeout)
        {
            window.clearTimeout(oldTimeout);
        }

        const saveTimeout: number = window.setTimeout(() =>
        {
            saveValue(value);
            sliderSaveTimeouts.delete(props.id);
        }, 2500);

        sliderSaveTimeouts.set(props.id, saveTimeout);
    }

    function saveValue(valueToSave: number): void
    {
        if (typeof props.onChange === 'function')
        {
            props.onChange(props.id, valueToSave);
        }
    }

    const sliderActiveColor = `var(--setting-slider-active)`;
    const sliderBackgroundColor = `var(--setting-slider-bg)`;
    const sliderPercent = (sliderValue / maxSliderValue) * 100;

    return (<div className={preferencesStyles.setting}>
        <SettingName name={props.name} />
        <div className={preferencesStyles['slider-wrapper']}>
            <input type="range" className={preferencesStyles['slider']} value={sliderValue} min={0} max={maxSliderValue} onChange={handleChangeSlider} style={
                {
                    background: `linear-gradient(to right, ${sliderActiveColor} 0%, ${sliderActiveColor} ${sliderPercent}%, ${sliderBackgroundColor} ${sliderPercent}%, ${sliderBackgroundColor} 100%)`
                }
            } />
            <input type="text" className={preferencesStyles['slider-text']} value={renderValue} onChange={handleTextChange} onBlur={handleBlur} />

        </div>
    </div>);
}

interface IPathSettingProps
{
    id: string;
    name: string;
    value: string;
    type: EBrowseType;
    bMultiselect: boolean;
    filters: Array<IBrowseFileFilter>;
    onChange: (id: string, value: string) => void;
}

function PathSetting(props: IPathSettingProps): JSX.Element
{
    const [value, setValue] = useState(props.value);

    function handlePathSelected(paths: Array<string>): void
    {
        if (paths && paths.length)
        {
            setValue(paths[0]);

            if (typeof props.onChange === 'function')
            {
                props.onChange(props.id, paths[0]);
            }
        }
    }

    function handleClick(): void
    {
        ipcRenderer.invoke('path-setting-browse-click', props.type, props.bMultiselect, props.filters).then(handlePathSelected);
    }

    return (<div className={preferencesStyles.setting}>
        <SettingName name={props.name} />
        <div className={preferencesStyles['path-wrapper']}>
            <input type="text" value={value} readOnly={true} className={preferencesStyles['path-input']}/>
            <Button text="Browse..." class={preferencesStyles['browse-button']} onClick={handleClick} />
        </div>
    </div>);
}

interface IInputSettingProps
{
    id: string;
    name: string;
    value: string;
    placeholder?: string;
    onChange: (id: string, value: string) => void;
}

function InputSetting(props: IInputSettingProps): JSX.Element
{
    const [value, setValue] = useState(props.value);

    function handleInput(event: React.ChangeEvent<HTMLInputElement>): void
    {
        const newValue = event.target.value;
        if (newValue !== undefined)
        {
            setValue(newValue);
        }
    }

    function handleBlur(): void
    {
        saveValue();
    }

    function handleKeyUp(event: React.KeyboardEvent<HTMLInputElement>): void
    {
        if (event.code === 'Enter')
        {
            saveValue();
        }
    }

    function saveValue(): void
    {
        const tempValue = value.trim().replace(/(\s){2,}/g, ' ');
        if (tempValue !== value)
        {
            setValue(tempValue);
        }

        if (typeof props.onChange === 'function')
        {
            props.onChange(props.id, value);
        }
    }

    return (<div className={`${preferencesStyles.setting}`}>
        <SettingName name={props.name} />
        <input className={preferencesStyles['input-setting']} type="text" value={value} placeholder={`${props.placeholder || props.name}`} onChange={handleInput} onKeyUp={handleKeyUp} onBlur={handleBlur} />
    </div>);
}

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

    function handleFontFamilyChange(id: string, fontFamily: string): void
    {
        updateBookFontFamily(fontFamily);

        onSettingChange(id, fontFamily);
    }

    function handleFontSizeChange(id: string, fontSize: number): void
    {
        updateBookFontSize(fontSize);

        onSettingChange(id, fontSize);
    }

    function onSettingChange(id: string, value: unknown): void
    {
        console.log(`change setting ${id} to ${value}`);
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
                <SilderSetting id="fontSize" name="Font Size" value={props.preferences.fontSize} min={minBookFontSize} max={maxBookFontSize} onChange={handleFontSizeChange} />
                <InputSetting id="fontFamily" name="Font Family" value={props.preferences.fontFamily} onChange={handleFontFamilyChange} />
                <PathSetting id="booksDir" name="Saved Books directory" value={props.preferences.booksDir} onChange={onSettingChange} type={EBrowseType.Directory} bMultiselect={false} filters={[{ name: 'Directory', extensions: ['*'] }]} />
                <CheckboxSetting id="allowCustomColors" name="Allow custom book colors" value={props.preferences.allowCustomColors} onChange={onSettingChange} />
                <CheckboxSetting id="inverseImageColors" name="Inverse image colors" value={props.preferences.inverseImageColors} onChange={onSettingChange} />
                <CheckboxSetting id="widePages" name="Wide pages" value={props.preferences.widePages} onChange={onSettingChange} />
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