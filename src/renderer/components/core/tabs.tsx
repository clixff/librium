import React from 'react';
import TabsStyles from '../../styles/modules/tabs.module.css';
import { ITab } from '../../misc/tabs';
import { IAppState } from '../../misc/redux/store';
import { useSelector } from 'react-redux';

interface ITabProps
{
    data: ITab;
    index: number;
    /**
     * Index of active tab
     */
    activeIndex: number;
}

function Tab(props: ITabProps): JSX.Element
{   
    let bRenderRightLine = true;
    if (props.data.active)
    {
        bRenderRightLine = false;
    }
    function handleTabClick(): void
    {
        console.log(`Tab ${props.index} clicked`);
    }
    return (<div className={`${TabsStyles.tab} ${props.data.active ? TabsStyles.active : ''}`} onClick={handleTabClick}>
        {
            props.data.name
        }
    </div>);
}

interface ITabsListProps
{
    list: Array<ITab>;
    /**
     * Index of active tab
     */
    active: number;
}


export function TabsList(): JSX.Element
{
    /**
     * Props from the Redux state
     */
    const stateProps: ITabsListProps = useSelector((state: IAppState) => 
    {
        return {
            list: state.tabs.list,
            active: state.tabs.active
        };
    });

    return (<div id={TabsStyles.wrapper}>
        <div id={TabsStyles.container}>
            {
                stateProps.list.map((tab, index) =>
                {
                    return (<Tab data={tab} index={index} key={tab.key} activeIndex={stateProps.active}/>);
                })
            }
        </div>
        <div id={TabsStyles.scrollbar}>
            <div id={TabsStyles['scrollbar-thumb']} />
        </div>
    </div>);
}