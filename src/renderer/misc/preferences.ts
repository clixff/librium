import { EColorTheme, IPreferences } from "../../shared/preferences";

export function fixPreferences(preferences: IPreferences): IPreferences
{
    if (preferences.colorTheme !== EColorTheme.Dark)
    {
        preferences.colorTheme = EColorTheme.Light;
    }

    if (!isFinite(preferences.fontSize) || preferences.fontSize < 1 || preferences.fontSize > 32)
    {
        preferences.fontSize = 16;
    }

    return preferences;
}