import { ipcRenderer } from "electron";
import { IBookChunk } from "../../shared/schema";
import { deleteBookFromCategory, ICategory } from "./category";

export interface IBookBase
{
    title: string;
    authors: Array<string>;
    language: string;
    publisher: string;
    chunks: Array<IBookChunk>;
    lastTimeOpened: number;
    cover: string;
    id: string;
}

export interface IBook extends IBookBase
{
    categories: Array<ICategory>
}

export function rawBookToBook(rawBook: IBookBase): IBook
{
    return {
        ...rawBook,
        categories: [],
    };
}

export function rawBooksToBooks(rawBooksArray: Array<IBookBase>, booksMap: Map<string, IBook>): Array<IBook>
{
    const books: Array<IBook> = [];
    for (let i = 0; i < rawBooksArray.length; i++)
    {
        const book = rawBookToBook(rawBooksArray[i]);
        books.push(book);
        booksMap.set(book.id, book);
    }

    return books;
}

export function filterBooksBySearch(allBooks: Array<IBook>, searchQuery: string): [Array<IBook>, string]
{
    const filteredBooks: Array<IBook> = [];
    let booksKeys = '';

    for (let i = 0; i < allBooks.length; i++)
    {
        const book = allBooks[i];
        const lowerCasedTitle = book.title.trim().toLowerCase();
        let bFoundResult = false;
        if (lowerCasedTitle.includes(searchQuery))
        {
            bFoundResult = true;
        }
        else
        {
            const allBookAuthors = book.authors;
            for (let j = 0; j < allBookAuthors.length; j++)
            {
                const lowerCasedBookAuthor = allBookAuthors[j].trim().toLowerCase();
                if (lowerCasedBookAuthor.includes(searchQuery))
                {
                    bFoundResult = true;
                    break;
                }
            }
        }

        if (bFoundResult)
        {
            booksKeys += book.id;
            filteredBooks.push(book);
        }
    }

    return [filteredBooks, booksKeys];
}

export function deleteBook(book: IBook): void
{
    ipcRenderer.send('delete-book', book.id);

    if (book.categories.length)
    {
        for (let i = 0; i < book.categories.length; i++)
        {
            const category = book.categories[i];
            deleteBookFromCategory(category, book);
        }
    }
}