export enum ETabType
{
    newTab,
    book,
    preferences
}

export class Tab
{
    name = '';
    type: ETabType = ETabType.newTab;
    icon: string | null = null;
    key = '';
    content: JSX.Element | null = null;
    constructor(name: string, type: ETabType, icon?: string | null, key?: string)
    {
        this.name = name;
        this.type = type;
        this.icon = icon ? icon : null;
        this.key = key ? key : Tab.generateKey(this.name);
    }
    static generateKey(tabName: string): string
    {
        const dateNow = (Date.now()).toString(16);
        const randomString = Math.floor(Math.random() * 0xFFFF).toString(16);
        return `${tabName}-${dateNow}-${randomString}`;
    }
}