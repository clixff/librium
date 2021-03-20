import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import { EBrowseType, EColorTheme, IBrowseFileFilter, IPreferences } from '../../../shared/preferences';
import { AppSingleton } from '../../app';
import { ArrowSVG, CloseTitlebarSVG, MarkSVG, MinimizeSVG } from '../../misc/icons';
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
            if (event.target)
            {
                const inputElement = event.target as HTMLElement;
                inputElement.blur();
            }
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

    return (<div id={preferencesStyles.wrapper}>
        <div id={preferencesStyles['page-content']}>
            <h1 id={preferencesStyles['page-title']}>
                Preferences
            </h1>
            <div id={preferencesStyles.container}>
                <DropdownSetting id="colorTheme" name="Color Theme" options={['Dark', 'Light']} activeOption={props.preferences.colorTheme} onChange={handleColorThemeChange} />
                <SilderSetting id="fontSize" name="Font Size" value={props.preferences.fontSize} min={minBookFontSize} max={maxBookFontSize} onChange={handleFontSizeChange} />
                <InputSetting id="fontFamily" name="Font Family" value={props.preferences.fontFamily} onChange={handleFontFamilyChange} />
                <PathSetting id="booksDir" name="Saved Books directory" value={props.preferences.booksDir} onChange={handleSettingChanged} type={EBrowseType.Directory} bMultiselect={false} filters={[{ name: 'Directory', extensions: ['*'] }]} />
                <CheckboxSetting id="allowCustomColors" name="Allow custom book colors" value={props.preferences.allowCustomColors} onChange={handleSettingChanged} />
                <CheckboxSetting id="inverseImageColors" name="Inverse image colors" value={props.preferences.inverseImageColors} onChange={handleSettingChanged} />
                <CheckboxSetting id="widePages" name="Wide pages" value={props.preferences.widePages} onChange={handleSettingChanged} />
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

interface IToolbarDropdownSettingsContainerProps
{
    preferences: IPreferences;
}

export function ToolbarDropdownSettingsContainer(props: IToolbarDropdownSettingsContainerProps): JSX.Element
{
    function handleDarkModeSetting(id: string, value: boolean): void
    {
        handleColorThemeChange('colorTheme', value ? EColorTheme.Dark : EColorTheme.Light);
    }

    return (<React.Fragment>
            <FontSizeSetting name="Font Size" value={props.preferences.fontSize} />
            <InputSetting id="fontFamily" name="Font Family" value={props.preferences.fontFamily} onChange={handleFontFamilyChange} />
            <CheckboxSetting id="darkMode" name="Dark Mode" value={props.preferences.colorTheme === EColorTheme.Dark} onChange={handleDarkModeSetting}  />
    </React.Fragment>);
}

function handleSettingChanged(settingID: string, value: unknown): void
{
    if (AppSingleton)
    {
        AppSingleton.changeSetting(settingID, value);
    }
}

function handleFontFamilyChange(id: string, fontFamily: string): void
{
    updateBookFontFamily(fontFamily);

    handleSettingChanged(id, fontFamily);
}

function handleFontSizeChange(id: string, fontSize: number): void
{
    updateBookFontSize(fontSize);

    handleSettingChanged(id, fontSize);
}

function handleColorThemeChange(id: string, option: number): void
{
    let colorTheme: EColorTheme = option;
    if (colorTheme !== EColorTheme.Dark)
    {
        colorTheme = EColorTheme.Light;
    }

    changeColorTheme(colorTheme);

    handleSettingChanged(id, option);
}

let fontSizeSettingSaveTimeout: number | null = null;
let fontsizeSettingValue = 16;

interface IFontSizeSettingProps
{
    name: string;
    value: number;
}

function FontSizeSetting(props: IFontSizeSettingProps): JSX.Element
{
    const [value, _setValue] = useState(props.value);

    function setValue(newValue: number): void
    {
        if (newValue < minBookFontSize || newValue > maxBookFontSize)
        {
            return;
        }

        _setValue(newValue);

        fontsizeSettingValue = newValue;

        updateBookFontSize(newValue);

        if (AppSingleton)
        {
            AppSingleton.changeSetting('fontSize', newValue, false);
        }

        if (fontSizeSettingSaveTimeout)
        {
            window.clearTimeout(fontSizeSettingSaveTimeout);
        }

        fontSizeSettingSaveTimeout = window.setTimeout(saveFontSizeToDisk, 3000);
    }

    function handeClickSubtract(): void
    {
        setValue(value - 1);
    }

    function handeClickAdd(): void
    {
        setValue(value + 1);
    }

    useEffect(() =>
    {
        return (() => 
        {
            if (fontSizeSettingSaveTimeout)
            {
                saveFontSizeToDisk();
            }
        });
    }, []);

    function saveFontSizeToDisk(): void
    {
        if (fontSizeSettingSaveTimeout)
        {
            window.clearTimeout(fontSizeSettingSaveTimeout);
            
            fontSizeSettingSaveTimeout = null;
        }

        if (AppSingleton)
        {
            changeSetting(AppSingleton.state.preferences, 'fontSize', fontsizeSettingValue);
        }
    }

    return (<div className={preferencesStyles.setting}>
        <SettingName name={props.name} />
        <div className={preferencesStyles['font-size-wrapper']}>
            <div className={preferencesStyles['font-size-button']} onClick={handeClickSubtract}>
                <MinimizeSVG />
            </div>
            <div className={preferencesStyles['font-size-number']}>
                {
                    value
                }
            </div>
            <div className={preferencesStyles['font-size-button']} onClick={handeClickAdd}>
                <CloseTitlebarSVG />
            </div>
        </div>
    </div>);
}