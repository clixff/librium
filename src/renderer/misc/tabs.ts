import { EMenuElementType, EViewType } from '../components/pages/newTab';
import { IBook } from './book';
import { getDefaultBooksViewType } from './misc';

export enum ETabType
{
    newTab,
    book,
    preferences
}

export interface INewTabState
{
    menu: EMenuElementType;
    viewType: EViewType;
    activeCategory: number;
}

export interface IBookPageData
{
    /**
     * Full height of the book page
     */
    bookHeight: number;
    /**
     * Visible height of the book page
     */
    bookPageHeight: number;
    bookContainerMarginBottom: number;
    currentPage: number;
    percentReadToSave: number;
    totalNumberOfPages: number;
    backToPageNumber: number;
    bookWrapper: HTMLElement | null;

}

export interface IBookTabState
{
    bookId: string;
    book: IBook | null;
    data: IBookPageData;
}

export type TabState = Partial<INewTabState & IBookTabState> | null;

export class Tab
{
    name = '';
    type: ETabType = ETabType.newTab;
    icon: string | null = null;
    key = '';
    state: TabState = null;
    constructor(name: string, type: ETabType, icon?: string | null, key?: string)
    {
        this.name = name;
        this.type = type;
        this.icon = icon ? icon : null;
        this.key = key ? key : Tab.generateKey(this.name);

        switch (type)
        {
            case ETabType.newTab:
                this.state = {
                    menu: EMenuElementType.Books,
                    activeCategory: -1,
                    viewType: getDefaultBooksViewType()
                };
                break;
            case ETabType.book:
                this.state = {
                    bookId: '',
                    book: null,
                    data: {
                        bookHeight: 0,
                        bookPageHeight: 0,
                        bookContainerMarginBottom: 0,
                        currentPage: 0,
                        totalNumberOfPages: 0,
                        bookWrapper: null,
                        backToPageNumber: 0,
                        percentReadToSave: 0
                    }
                };
                break;
        }
    }
    static generateKey(tabName: string): string
    {
        const dateNow = (Date.now()).toString(16);
        const randomString = Math.floor(Math.random() * 0xFFFF).toString(16);
        return `${tabName}-${dateNow}-${randomString}`;
    }
}

/**
 * Tab data loaded from disk
 */
export interface IRawTab
{
    name: string;
    type: number;
    icon: string | null;
    key: '';
    state: Record<string, unknown> | null;
}

/**
 * Loads raw tab from disk and converts to Tab object
 */
export function loadTab(rawTab: IRawTab): Tab
{
    const tabType = (rawTab.type === 0 ? ETabType.newTab : (rawTab.type === 1 ? ETabType.book : ETabType.preferences));

    const tab: Tab = new Tab(rawTab.name, tabType, rawTab.icon, rawTab.key);

    if (rawTab.state)
    {
        tab.state = rawTab.state;
    }

    return tab;
}