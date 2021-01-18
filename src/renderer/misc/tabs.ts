export enum ETabType
{
    newTab,
    book,
    preferences
}

export interface ITab
{
    name: string;
    type: ETabType;
    active: boolean;
    icon: string | null;
    /** Random key string */
    key: string;
}

export function generateKeyForTab(tabName: string): string
{
    const dateNow = (Date.now()).toString(16);
    const randomString = Math.floor(Math.random() * 0xFFFF).toString(16);
    return `${tabName}-${dateNow}-${randomString}`;
}