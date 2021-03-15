import { AppSingleton } from "../app";
import { EViewType } from "../components/pages/newTab";

export function bindFunctionsContext(context: unknown, methodsList: Array<string>): void
{
    if (!context || typeof context !== 'object' || context === null || Array.isArray(context) || !Array.isArray(methodsList))
    {
        return;
    }

    for (let i = 0; i < methodsList.length; i++)
    {
        const methodName: string = methodsList[i];
        const method: (...args) => unknown | undefined | unknown = context[methodName];
        if (typeof method === 'function')
        {
            context[methodName] = method.bind(context);
        }
        else
        {
            console.error();
        }
    }

}


export function getDefaultBooksViewType(): EViewType
{
    let defaultViewType = EViewType.Grid;

    if (window && window.localStorage)
    {
        const viewTypeNumber: string | null = window.localStorage.getItem('default-books-view-type');

        if (viewTypeNumber === '1')
        {
            defaultViewType = EViewType.List;
        }
    }

    return defaultViewType;
}

export function saveDefaultBooksViewType(viewType: EViewType): void
{
    const viewTypeNumber: '0' | '1' = viewType === EViewType.Grid ? '0' : '1';
    
    if (window && window.localStorage)
    {
        window.localStorage.setItem('default-books-view-type', viewTypeNumber);
    }
}

/**
 * Exports tabs list to the main process, then saves it to disk before app quit
 */
export function SaveTabs(): void
{
    if (AppSingleton)
    {
        AppSingleton.saveTabs();
    }
}

export function querySelectorWrapper(element: HTMLElement, selector: string): HTMLElement | null
{
    try
    {
        return element.querySelector(selector);
    }
    catch (error)
    {
        console.error(error);
    }

    return null;
}

export function findElementByID(parentElement: HTMLElement, elementID: string): HTMLElement | null
{
    try
    {
        if (parentElement && parentElement.children)
        {
            for (let i = 0; i < parentElement.children.length; i++)
            {
                const childElement = parentElement.children[i] as HTMLElement;

                if (childElement.id === elementID)
                {
                    return childElement;
                }

                const foundInChild = findElementByID(childElement, elementID);

                if (foundInChild)
                {
                    return foundInChild;
                }
            }
        }
    }
    catch (error)
    {
        console.error(error);
    }

    return null;
}