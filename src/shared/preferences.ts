export enum EColorTheme
{
    Dark,
    Light
}

export interface IPreferences
{
    /**
     * Path to the directory with saved books
     */
    booksDir: string;
    colorTheme: EColorTheme;
    fontSize: number;
    fontFamily: string;
}

/**
 * Select file or directory type
 */
export enum EBrowseType
{
    File,
    Directory
}

export interface IBrowseFileFilter
{
    name: string;
    extensions: Array<string>;
}