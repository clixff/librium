import { EMenuElementType, EViewType } from '../components/pages/newTab'

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

export interface IBookTabState
{
    bookId: string;
}

export type TabState = Partial<INewTabState & IBookTabState> | null;

export class Tab
{
    name = '';
    type: ETabType = ETabType.newTab;
    icon: string | null = null;
    key = '';
    content: JSX.Element | null = null;
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
                    viewType: EViewType.Grid
                };
                break;
            case ETabType.book:
                this.state = {
                    bookId: ''
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