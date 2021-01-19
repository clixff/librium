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

/**
 * #tabs-module__scrollbar
 */
let scrollbarElement: HTMLElement | null = null;
/**
 * #tabs-module__scrollbar-thumb
 */
let scrollbarThumbElement: HTMLElement | null = null;
/**
 * #tabs-module__container
 */
let tabsContainerElement: HTMLElement | null = null;
let bIsScrolling = false;
let scrollbarThumbOffset = 0;
let xCooordThumbClickedOn = 0;

/**
 * Saves tabs list elements for scrolling
 */
function setTabsListVars(): void
{
    if (!scrollbarElement)
    {
        scrollbarElement = document.getElementById(TabsStyles.scrollbar);
    }

    if (!scrollbarThumbElement)
    {
        scrollbarThumbElement = document.getElementById(TabsStyles['scrollbar-thumb']);
    }

    if (!tabsContainerElement)
    {
        tabsContainerElement = document.getElementById(TabsStyles.container);
    }
}

function handleScrollbarMove(event: MouseEvent): void
{
    if (!bIsScrolling || !scrollbarElement || !scrollbarThumbElement || !tabsContainerElement)
    {
        return;
    }

    const x = event.clientX;

    scrollbarThumbOffset = x - xCooordThumbClickedOn;

    const scrollbarWidth = scrollbarElement.clientWidth;
    const scrollbarThumbWidth = scrollbarThumbElement.clientWidth;
    const maxAllowedThumbOffset = scrollbarWidth - scrollbarThumbWidth;

    if (maxAllowedThumbOffset < scrollbarThumbOffset)
    {
        scrollbarThumbOffset = maxAllowedThumbOffset;
    }

    if (scrollbarThumbOffset < 0)
    {
        scrollbarThumbOffset = 0;
    }

    const scrollingPercent = scrollbarThumbOffset / maxAllowedThumbOffset;

    scrollbarThumbElement.style.marginLeft = `${scrollbarThumbOffset}px`;

    const tabsContainerVisibleWidth = scrollbarWidth;
    const tabsContainerFullWidth = tabsContainerElement.scrollWidth;
    const maxScrollOffset = tabsContainerFullWidth - tabsContainerVisibleWidth;

    tabsContainerElement.scrollLeft = maxScrollOffset * scrollingPercent;
}

function stopScrollbarMove(): void
{
    if (bIsScrolling)
    {
        document.body.style.userSelect = 'auto';
    }
    bIsScrolling = false;
}

function startScrollbarMove(event: React.MouseEvent): void
{
    setTabsListVars();

    bIsScrolling = true;
    xCooordThumbClickedOn = event.clientX - scrollbarThumbOffset;

    /**
     * Disable text selecting on scroll
     */
    document.body.style.userSelect = 'none';
}

function resizeScrollbar()
{
    setTabsListVars();
    console.log('Resize1');

    if (!scrollbarThumbElement || !tabsContainerElement)
    {
        return;
    }

    console.log('Resize2');

    const minScrollbarThumbWidth = 30; // px

    const tabsContainerVisibleWidth = tabsContainerElement.clientWidth;
    const tabsContainerFullWidth = tabsContainerElement.scrollWidth;
    const maxScrollOffset = tabsContainerFullWidth - tabsContainerVisibleWidth;

    let scrollbarThumbWidth = minScrollbarThumbWidth;

    if (!maxScrollOffset)
    {
        scrollbarThumbWidth = 0;
    }

    console.log(`Set width to ${scrollbarThumbWidth}`);

    scrollbarThumbElement.style.width = `${scrollbarThumbWidth}px`;

    if (!maxScrollOffset)
    {
        return;
    }

    /**
     * Container scrollLeft
     */
    const currentScrollValue = tabsContainerElement.scrollLeft || 0;

    const scrollingPercent = currentScrollValue / maxScrollOffset;
    const maxScrollThumbOffset = tabsContainerVisibleWidth - scrollbarThumbWidth;
    scrollbarThumbOffset = scrollingPercent * maxScrollThumbOffset;
    if (scrollbarThumbOffset < 0)
    {
        scrollbarThumbOffset = 0;
    }
    else if (scrollbarThumbOffset > maxScrollThumbOffset)
    {
        scrollbarThumbOffset = maxScrollThumbOffset;
    }
    console.log(`tabsContainerVisibleWidth: ${tabsContainerVisibleWidth}\ntabsContainerFullWidth: ${tabsContainerFullWidth}\nmaxScrollOffset: ${maxScrollOffset}\ncurrentScrollValue: ${currentScrollValue}\nscrollingPercent: ${scrollingPercent}\nscrollbarThumbOffset: ${scrollbarThumbOffset}\n`);
    scrollbarThumbElement.style.marginLeft = `${scrollbarThumbOffset}px`;
}

window.addEventListener('resize', resizeScrollbar);
window.addEventListener('mouseup', stopScrollbarMove);
window.addEventListener('mousemove', handleScrollbarMove);


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
            <div id={TabsStyles['scrollbar-thumb']} onDragStart={() => false} onMouseDown={startScrollbarMove} />
        </div>
    </div>);
}