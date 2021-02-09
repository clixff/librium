import { ipcRenderer } from "electron";
import { IBook } from "./book";

export interface ICategory
{
    name: string;
    books: Array<IBook>;
    id: string;
}

/**
 * Category object from the main process
 */
export interface IRawCategory
{
    name: string;
    id: string;
    /**
     * Array of books IDs
     */
    books: Array<string>;
}

export function generateCategoryId(name: string): string
{
    return `${name}-${Math.floor(Math.random() * 0xFFFFFFFF).toString(16)}`;
}

export function parseCategories(rawCategories: Array<IRawCategory>, booksMap: Map<string, IBook>): Array<ICategory>
{
    const categoriesList: Array<ICategory> = [];

    for (let i = 1; i <= rawCategories.length; i++)
    {
        const rawCategory = rawCategories[rawCategories.length - i];
        if (!rawCategory)
        {
            continue;
        }

        const category: ICategory = {
            name: rawCategory.name,
            id: rawCategory.id,
            books: []
        };
        for (let j = 0; j < rawCategory.books.length; j++)
        {
            const bookID = rawCategory.books[j];
            const book: IBook | undefined = booksMap.get(bookID);
            if (book)
            {
                category.books.push(book);
                book.categories.push(category);
            }
        }
        categoriesList.push(category);
    }

    return categoriesList;
}

interface ICategoriesSearchResult
{
    list: Array<ICategory>;
    keys: string;
}

export function filterCategoriesBySeach(categoriesArray: Array<ICategory>, searchQuery: string): ICategoriesSearchResult
{
    const searchQueryLowerCased = searchQuery.toLowerCase().trim();

    if (!searchQueryLowerCased)
    {
        return {
            list: categoriesArray,
            keys: 'ALL'
        };
    }
    
    const resultArray: Array<ICategory> = [];
    let listKeys = '';

    for (let i = 0; i < categoriesArray.length; i++)
    {
        const category = categoriesArray[i];
        if (category)
        {
            const categoryName = category.name.toLowerCase().trim();
            if (categoryName.includes(searchQueryLowerCased))
            {
                resultArray.push(category);
                listKeys += category.id;
            }
        }
    }

    return {
        list: resultArray,
        keys: listKeys
    };
}

export function deleteBookFromCategory(category: ICategory, book: IBook): void
{
    for (let i = 0; i < category.books.length; i++)
    {
        const tempBook = category.books[i];
        if (tempBook.id === book.id)
        {
            category.books.splice(i, 1);
            ipcRenderer.send('delete-book-from-category', category.id, book.id);
            break;
        }
    }
}