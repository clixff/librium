import { configureStore } from "@reduxjs/toolkit";
import { ITabsState, tabsReducer } from "./features/tabs";

export interface IAppState
{
    tabs: ITabsState
}

const store = configureStore({
    reducer: {
        tabs: tabsReducer
    },
    devTools: process.env.NODE_ENV === 'development'
});


export default store;