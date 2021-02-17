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