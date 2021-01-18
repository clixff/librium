import React from 'react';
import TitlebarStyles from '../../styles/modules/titlebar.module.css';
import { MinimizeSVG, MaximizeSVG, CloseTitlebarSVG } from '../../misc/icons';
import { ipcRenderer } from 'electron';
import { TitlebarButtonType } from '../../../shared/misc';
import { TabsList } from './tabs';


export function TitleBar(): JSX.Element
{
    function handleControlButtonClick(type: TitlebarButtonType): void
    {
        ipcRenderer.send('titlebar-button-clicked', type);
    }
    
    return (<div id={TitlebarStyles.wrapper}>
        <div id={TitlebarStyles.drag}/>
        <TabsList />
        <div id={TitlebarStyles.controls}>
            <div className={TitlebarStyles['control-button']} id={TitlebarStyles['control-minimize']} onClick={() => { handleControlButtonClick('minimize'); }}>
                <MinimizeSVG />
            </div>
            <div className={TitlebarStyles['control-button']} id={TitlebarStyles['control-maximize']} onClick={() => { handleControlButtonClick('maximize'); }}>
                <MaximizeSVG />
            </div>
            <div className={TitlebarStyles['control-button']} id={TitlebarStyles['control-close']} onClick={() => { handleControlButtonClick('close'); }}>
                <CloseTitlebarSVG />
            </div>
        </div>
    </div>);
}