import path from 'path';
import { getAppDataPath } from '../paths';
import fs, { promises as fsPromises } from 'fs';
import { ipcMain } from 'electron';

export interface ICategory
{
    name: string;
    id: string;
    /**
     * Array of books IDs
     */
    books: Array<string>;
}

const categoriesPath = path.join(getAppDataPath(), 'categories.json');
let categoriesList: Array<ICategory> = [];

let saveCategoriesTimeout: NodeJS.Timeout | null = null;

function saveCategoriesFile(): void
{
    const categoriesJSON = JSON.stringify(categoriesList, null, '\t');
    fsPromises.writeFile(categoriesPath, categoriesJSON, { encoding: 'utf-8' });
}

export async function loadCategories(): Promise<Array<ICategory>>
{
    return new Promise((resolve) =>
    {
        fs.access(categoriesPath, async (err) =>
        {
            try
            {
                if (err)
                {
                    saveCategoriesFile();
                }
                else
                {
                    const categoriesJSON = await fsPromises.readFile(categoriesPath, { encoding: 'utf-8' });
                    const parsedCategories = JSON.parse(categoriesJSON);
                    if (parsedCategories && Array.isArray(parsedCategories))
                    {
                        categoriesList = parsedCategories;
                    }
                    else
                    {
                        saveCategoriesFile();
                    }
                }
            }
            catch (error)
            {
                console.error(error);
                saveCategoriesFile();
            }

            resolve(categoriesList);
        });
    });
}

ipcMain.on('update-category-name', async (event, prevId, newName, newId) =>
{
    try
    {
        console.log(`Rename category ${prevId} to ${newName}`);
        if (categoriesList)
        {
            let bRenamed = false;
            const categoryToRename: ICategory | null = findCategoryById(prevId);
            if (categoryToRename)
            {
                categoryToRename.name = newName;
                categoryToRename.id = newId;
                bRenamed = true;
            }

            if (bRenamed)
            {
                saveCategoriesWithTimer();
            }
        }
    }
    catch (error)
    {
        console.error(error);
    }
});

function saveCategoriesWithTimer()
{
    if (!saveCategoriesTimeout)
    {
        saveCategoriesTimeout = setTimeout(() => 
        {
            saveCategoriesFile();
            if (saveCategoriesTimeout)
            {
                clearTimeout(saveCategoriesTimeout);
                saveCategoriesTimeout = null;
            }
        }, 2500);
    }
}

function findCategoryById(key: string): ICategory | null
{
    for (let i = 0; i < categoriesList.length; i++)
    {
        const category = categoriesList[i];
        if (category && category.id === key)
        {
            return category;
        }
    }
    return null;
}

ipcMain.on('delete-book-from-category', (event, categoryId: string, bookId: string) =>
{
    deleteBookFromCategory(categoryId, bookId);
});

function deleteBookFromCategory(categoryId: string, bookid: string): void
{
    const category: ICategory | null = findCategoryById(categoryId);
    if (category)
    {
        const bookIndexInCategory = category.books.indexOf(bookid);
        if (bookIndexInCategory !== -1)
        {
            category.books.splice(bookIndexInCategory, 1);
            saveCategoriesWithTimer();
        }
    }
}