import { IBookChunk } from "../../shared/schema";
import { ICategory } from "./category";

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
        authors: rawBook.authors,
        categories: [],
        chunks: rawBook.chunks || [],
        cover: rawBook.cover,
        id: rawBook.id,
        language: rawBook.language,
        lastTimeOpened: rawBook.lastTimeOpened,
        publisher: rawBook.publisher,
        title: rawBook.title
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