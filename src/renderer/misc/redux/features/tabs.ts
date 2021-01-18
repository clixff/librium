import { createSlice } from "@reduxjs/toolkit";
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
        active: true,
        icon: null,
        key: generateKeyForTab('New Tab'),
        name: 'New Tab',
        type: ETabType.newTab
    },
    {
        active: false,
        icon: null,
        key: generateKeyForTab('Lorem ipsum'),
        name: 'Lorem ipsum',
        type: ETabType.book
    },
    {
        active: false,
        icon: null,
        key: generateKeyForTab('Dolor sit amet'),
        name: 'Dolor sit amet',
        type: ETabType.book
    },
    {
        active: false,
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
        
    }
});

const tabsReducer = tabsSlice.reducer;

const tabsActions = tabsSlice.actions;

export { tabsReducer, tabsActions };