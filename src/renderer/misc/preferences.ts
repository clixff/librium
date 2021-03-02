import { EColorTheme, IPreferences } from "../../shared/preferences";

export const minBookFontSize = 11;
export const maxBookFontSize = 30;

export function fixPreferences(preferences: IPreferences): IPreferences
{
    if (preferences.colorTheme !== EColorTheme.Dark)
    {
        preferences.colorTheme = EColorTheme.Light;
    }

    if (!isFinite(preferences.fontSize) || preferences.fontSize < minBookFontSize || preferences.fontSize > maxBookFontSize)
    {
        preferences.fontSize = 16;
    }

    return preferences;
}

export function updateBookFontFamily(fontFamily: string): void
{
    const rootElement = document.documentElement;
    if (rootElement)
    {
        const defaultFontFamily = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif`;
        const newFontsParsed = fontFamily.split(',');
        const finalFonts: Array<string> = [];
        for (let i = 0; i < newFontsParsed.length; i++)
        {
            let fontName = newFontsParsed[i].trim();
            /**
             * If the font name contains a space and is not enclosed in quotation marks, enclose it in quotation marks.
             */
            if (fontName[0] !== `\"` && fontName[fontName.length-1] !== `\"` && fontName.includes(' '))
            {
                fontName = `\"${fontName}\"`;
            }

            if (fontName)
            {
                finalFonts.push(fontName);
            }

        }

        if (newFontsParsed.length)
        {
            const newFontFamily = `${newFontsParsed.join(', ')}, ${defaultFontFamily}`;
            console.log(`New book fonts is "${newFontFamily}"`);
            rootElement.style.setProperty('--book-font', newFontFamily);
        }
    }
}


export function updateBookFontSize(fontSize: number): void
{
    const rootElement = document.documentElement;
    if (rootElement)
    {
        if (!isFinite(fontSize) || fontSize < 11 || fontSize > 30)
        {
            fontSize = 16;
        }

        rootElement.style.setProperty('--book-font-size', `${fontSize}px`);
        
    }
}