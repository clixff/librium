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
    /**
     * Allow custom text colors from book styles
     */
    allowCustomColors: boolean;
    /**
     * Inverse images colors.
     * Useful for the dark mode
     */
    inverseImageColors: boolean;
    widePages: boolean;
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