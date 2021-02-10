import React from 'react';
import TitlebarStyles from '../../styles/modules/titlebar.module.css';
import { MinimizeSVG, MaximizeSVG, CloseTitlebarSVG } from '../../misc/icons';
import { ipcRenderer } from 'electron';
import { TitlebarButtonType } from '../../../shared/misc';
import { ITabsCallbacks, TabsList } from './tabs';
import { Tab } from '../../misc/tabs';


interface ITitlebarProps
{
    tabsList: Array<Tab>;
    activeTab: number;
    tabsCallbacks: ITabsCallbacks;
}

export const TitleBar = React.memo((props: ITitlebarProps): JSX.Element => 
{
    function handleControlButtonClick(type: TitlebarButtonType): void
    {
        ipcRenderer.send('titlebar-button-clicked', type);
    }
    
    return (<div id={TitlebarStyles.wrapper}>
        <div id={TitlebarStyles.drag}/>
        <TabsList list={props.tabsList} activeTab={props.activeTab} callbacks={props.tabsCallbacks}/>
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
}, (prevProps, nextProps) =>
{
    return prevProps.tabsList === nextProps.tabsList && prevProps.activeTab === nextProps.activeTab;
});
