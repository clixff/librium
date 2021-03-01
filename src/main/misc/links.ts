import { ipcMain, shell } from "electron";

export function openLinkInBrowser(event: Event | null, url: string): void
{
    if (event)
    {
        event.preventDefault();
    }
    
    shell.openExternal(url);
}

ipcMain.on('open-link', (event, url) => 
{
    openLinkInBrowser(null, url);
});