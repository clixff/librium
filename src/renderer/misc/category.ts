import { IBook } from "./book";

export interface ICategory
{
    name: string;
    books: Array<IBook>;
    key: string;
}

/**
 * Category object from the main process
 */
export interface IRawCategory
{
    name: string;
    /**
     * Array of books IDs
     */
    books: Array<string>;
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
            key: `${rawCategory.name}-${Math.floor(Math.random() * 0xFFFF).toString(16)}`,
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