import path from 'path';
import { getAppDataPath } from '../paths';
import fs, { promises as fsPromises } from 'fs';

export interface ICategory
{
    name: string;
    /**
     * Array of books IDs
     */
    books: Array<string>;
}

const categoriesPath = path.join(getAppDataPath(), 'categories.json');
let categoriesList: Array<ICategory> = [];


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