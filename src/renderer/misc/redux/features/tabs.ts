import { Action, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ETabType, generateKeyForTab, ITab } from "../../tabs";

export interface ITabsState
{
    list: Array<ITab>;
    /**
     * Index of active tab
     */
    active: number;
}

const initialState: ITabsState = 
{
    list: [
    {
        icon: null,
        key: generateKeyForTab('New Tab'),
        name: 'New Tab',
        type: ETabType.newTab
    },
    {
        icon: null,
        key: generateKeyForTab('Lorem ipsum'),
        name: 'Lorem ipsum',
        type: ETabType.book
    },
    {
        icon: null,
        key: generateKeyForTab('Dolor sit amet'),
        name: 'Dolor sit amet',
        type: ETabType.book
    },
    {
        icon: null,
        key: generateKeyForTab('Preferences'),
        name: 'Preferences',
        type: ETabType.preferences
    }],
    active: 0
};
const tabsSlice = createSlice({
    name: 'tabs',
    initialState: initialState,
    reducers: {
        changeActiveTabIndex: (state, action: PayloadAction<number, string>) =>
        {
            return {
                ...state,
                active: action.payload
            };
        },
        openNewTab: (state, action: PayloadAction<ITab, string>) =>
        {
            const tabsList = [...state.list];
            tabsList.push(action.payload);
            return {
                list: tabsList,
                active: tabsList.length - 1
            };
        },
        closeTab: (state, action: PayloadAction<number, string>) => 
        {
            const tabsList = [...state.list];
            tabsList.splice(action.payload, 1);

            let newActiveTabIndex = state.active;
            if (newActiveTabIndex > action.payload)
            {
                newActiveTabIndex--;
            }
            if (newActiveTabIndex >= tabsList.length)
            {
                newActiveTabIndex = tabsList.length - 1;
            }

            return {
                list: tabsList,
                active: newActiveTabIndex
            };
        }
    }
});

const tabsReducer = tabsSlice.reducer;

const tabsActions = tabsSlice.actions;

export { tabsReducer, tabsActions };