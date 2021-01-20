import React, { useEffect } from 'react';
import TabsStyles from '../../styles/modules/tabs.module.css';
import { ETabType, generateKeyForTab, ITab } from '../../misc/tabs';
import { IAppState } from '../../misc/redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { NewTabSVG, CloseTitlebarSVG as CloseSVG } from '../../misc/icons';
import { tabsActions } from '../../misc/redux/features/tabs';
import { ipcRenderer } from 'electron';

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
    const isTabActive = props.index === props.activeIndex;
    if (isTabActive)
    {
        bRenderRightLine = false;
    }
    /**
     * If tab on the right is active
     */
    else if ((props.index + 1) === props.activeIndex)
    {
        bRenderRightLine = false;
    }


    const dispatch = useDispatch();

    function handleTabClick(): void
    {
        console.log(`Tab ${props.index} clicked`);
        if (isTabActive)
        {
            return;
        }
        dispatch(tabsActions.changeActiveTabIndex(props.index));
    }

    function handleCloseTabClick(event: React.MouseEvent): void
    {
        console.log(`Clicked close tab #${props.index}`);
        event.stopPropagation();
        dispatch(tabsActions.closeTab(props.index));
    }

    return (<div className={`${TabsStyles.tab} ${isTabActive ? TabsStyles.active : ''}`} onClick={handleTabClick} title={props.data.name}>
        <div className={TabsStyles['tab-content']}>
            <div className={TabsStyles['tab-content-left']}>
                <div className={TabsStyles['tab-title']}>
                {
                    props.data.name
                }
                </div>
            </div>
            <div className={TabsStyles['close']} title="" onClick={handleCloseTabClick}>
                <CloseSVG />
            </div>
        </div>
        {
            bRenderRightLine ? (<div className={TabsStyles['tab-right-line']}/>) : null
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

interface ITabsScrollbarVars
{
    elements: {
        /**
         * `#tabs-module__scrollbar`
         */
        scrollbar: HTMLElement | null;
        /**
         * `#tabs-module__scrollbar-thumb`
         */
        thumb: HTMLElement | null;
        /**
         * `#tabs-module__container`
         */
        container: HTMLElement | null;
    },
    bIsScrolling: boolean;
    /**
     * `margin-left` of the scrollbar thumb
     */
    thumbOffset: number;
    /**
     * Clicked X coordinate on the scrollbar thumb
     */
    clickedXCoordOnThumb: number;
    /**
     * Width in px of the scrollbar thumb
     */
    thumbWidth: number;
}

const tabsScrollVars: ITabsScrollbarVars = {
    elements: {
        scrollbar: null,
        thumb: null,
        container: null
    },
    bIsScrolling: false,
    thumbOffset: 0,
    clickedXCoordOnThumb: 0,
    thumbWidth: 0
};

/**
 * Saves tabs list elements for scrolling
 */
function setTabsListVars(): void
{
    if (!tabsScrollVars.elements.scrollbar)
    {
        tabsScrollVars.elements.scrollbar = document.getElementById(TabsStyles.scrollbar);
    }

    if (!tabsScrollVars.elements.thumb)
    {
        tabsScrollVars.elements.thumb = document.getElementById(TabsStyles['scrollbar-thumb']);
    }

    if (!tabsScrollVars.elements.container)
    {
        tabsScrollVars.elements.container = document.getElementById(TabsStyles.container);
    }
}

function handleScrollbarThumbMove(event: MouseEvent): void
{
    if (!tabsScrollVars.bIsScrolling || !tabsScrollVars.elements.scrollbar || !tabsScrollVars.elements.thumb || !tabsScrollVars.elements.container)
    {
        return;
    }

    const x = event.clientX;

    tabsScrollVars.thumbOffset = x - tabsScrollVars.clickedXCoordOnThumb;

    const scrollbarWidth = tabsScrollVars.elements.scrollbar.clientWidth;
    const maxAllowedThumbOffset = scrollbarWidth - tabsScrollVars.thumbWidth;

    if (maxAllowedThumbOffset < tabsScrollVars.thumbOffset)
    {
        tabsScrollVars.thumbOffset = maxAllowedThumbOffset;
    }

    if (tabsScrollVars.thumbOffset < 0)
    {
        tabsScrollVars.thumbOffset = 0;
    }

    const scrollingRatio = tabsScrollVars.thumbOffset / maxAllowedThumbOffset;

    tabsScrollVars.elements.thumb.style.marginLeft = `${tabsScrollVars.thumbOffset}px`;

    const tabsContainerVisibleWidth = scrollbarWidth;
    const tabsContainerFullWidth = tabsScrollVars.elements.container.scrollWidth;
    const maxScrollOffset = tabsContainerFullWidth - tabsContainerVisibleWidth;

    tabsScrollVars.elements.container.scrollLeft = maxScrollOffset * scrollingRatio;
}

function stopScrollbarMove(): void
{
    if (tabsScrollVars.bIsScrolling)
    {
        document.body.style.userSelect = 'auto';
    }
    tabsScrollVars.bIsScrolling = false;
}

function startScrollbarMove(event: React.MouseEvent): void
{
    setTabsListVars();

    tabsScrollVars.bIsScrolling = true;
    tabsScrollVars.clickedXCoordOnThumb = event.clientX - tabsScrollVars.thumbOffset;

    /**
     * Disable text selecting on scroll
     */
    document.body.style.userSelect = 'none';
}


function resizeScrollbar()
{
    setTabsListVars();

    if (!tabsScrollVars.elements.thumb || !tabsScrollVars.elements.container)
    {
        return;
    }

    const minScrollbarThumbWidth = 30; // px

    const tabsContainerVisibleWidth = tabsScrollVars.elements.container.clientWidth;
    const tabsContainerFullWidth = tabsScrollVars.elements.container.scrollWidth;
    const maxScrollOffset = tabsContainerFullWidth - tabsContainerVisibleWidth;

    tabsScrollVars.thumbWidth = 0;

    const scrollingRatio = tabsContainerVisibleWidth / tabsContainerFullWidth;

    if (scrollingRatio < 1)
    {
        tabsScrollVars.thumbWidth = scrollingRatio * tabsContainerVisibleWidth;
        if (tabsScrollVars.thumbWidth < minScrollbarThumbWidth)
        {
            tabsScrollVars.thumbWidth = minScrollbarThumbWidth;
        }
    }

    tabsScrollVars.elements.thumb.style.width = `${tabsScrollVars.thumbWidth}px`;

    if (!maxScrollOffset)
    {
        return;
    }

    /**
     * Container scrollLeft
     */
    const currentScrollValue = tabsScrollVars.elements.container.scrollLeft || 0;

    const scrollingPercent = currentScrollValue / maxScrollOffset;
    const maxScrollThumbOffset = tabsContainerVisibleWidth - tabsScrollVars.thumbWidth;
    tabsScrollVars.thumbOffset = scrollingPercent * maxScrollThumbOffset;
    if (tabsScrollVars.thumbOffset < 0)
    {
        tabsScrollVars.thumbOffset = 0;
    }
    else if (tabsScrollVars.thumbOffset > maxScrollThumbOffset)
    {
        tabsScrollVars.thumbOffset = maxScrollThumbOffset;
    }
    tabsScrollVars.elements.thumb.style.marginLeft = `${tabsScrollVars.thumbOffset}px`;
}

window.addEventListener('resize', resizeScrollbar);
window.addEventListener('mouseup', stopScrollbarMove);
window.addEventListener('mousemove', handleScrollbarThumbMove);

let bTabsInitialized = false;


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

    useEffect(() => 
    {
        if (bTabsInitialized)
        {
            if (stateProps.list.length === 0)
            {
                ipcRenderer.send('close-this-window');
                return;
            }
        }
        /**
         * Resize scrollbar when number of tabs changes
         */
        resizeScrollbar();
        bTabsInitialized = true;
    }, [stateProps.list.length]);

    const dispatch = useDispatch();

    function handleNewTabButtonClicked(): void
    {
        /**
         * TODO: Scroll to this tab
         */
        dispatch(tabsActions.openNewTab({
            icon: null,
            name: 'New Tab',
            type: ETabType.newTab,
            key: generateKeyForTab('New Tab')
        }));
    }

    return (<div id={TabsStyles.wrapper}>
        <div id={TabsStyles.container}>
            {
                stateProps.list.map((tab, index) =>
                {
                    return (<Tab data={tab} index={index} key={tab.key} activeIndex={stateProps.active}/>);
                })
            }
            <div id={TabsStyles['new-tab-button']} onClick={handleNewTabButtonClicked}>
                <NewTabSVG />
            </div>
        </div>
        <div id={TabsStyles.scrollbar}>
            <div id={TabsStyles['scrollbar-thumb']} onDragStart={() => false} onMouseDown={startScrollbarMove} />
        </div>
    </div>);
}