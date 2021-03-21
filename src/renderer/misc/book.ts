import { ipcRenderer } from "electron";
import { IBookChunk, IBookmark, ITOC } from "../../shared/schema";
import { deleteBookFromCategory, ICategory } from "./category";

export interface ITOCRenderer 
{
    name: string;
    bookPercent: number;
    pagesPercent: number;
    children?: Array<ITOCRenderer>;
}

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
    percentRead: number;
    percentPages: number;
    styles: Array<string>;
    tableOfContents: Array<ITOC>;
    bookmarks: Array<IBookmark>;

}

export interface IBook extends IBookBase
{
    categories: Array<ICategory>
}

export function rawBookToBook(rawBook: IBookBase): IBook
{
    const convertedBook: IBook = {
        ...rawBook,
        categories: [],
    };

    if (convertedBook.percentRead < 0 || !isFinite(convertedBook.percentRead))
    {
        convertedBook.percentRead = 0;
    }
    else if (convertedBook.percentRead > 1)
    {
        convertedBook.percentRead = 1;
    }

    if (convertedBook.percentPages < 0 || !isFinite(convertedBook.percentPages))
    {
        convertedBook.percentPages = 0;
    }
    else if (convertedBook.percentPages > 100)
    {
        convertedBook.percentPages = 100;
    }

    return convertedBook;
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

export function getBookCoverColor(bookId: string): string
{
    const customCoverColors = [
        '494036',
        '3A1919',
        '2F402E',
        '274C83',
        '323232',
        '364649',
        '331E31'
    ];

    const firstIdSymbol: number = parseInt(bookId[0] || '', 16);
    const coverColorID = firstIdSymbol % customCoverColors.length;
    const coverColor = customCoverColors[coverColorID];
    return coverColor;
}

export function getBookCustomCoverIconURL(bookId: string): string
{
    const color = getBookCoverColor(bookId);
    return `http://127.0.0.1:45506/file/book-cover-icon.svg?color=${color}`;
}

export function generateBookmarkID(): string
{
    const hexDate = Date.now().toString(16);
    const randomNumber = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);

    return `${hexDate}-${randomNumber}`;
}

export function removeBookmark(book: IBook, bookmarkID: string): void
{
    if (book && book.bookmarks && book.bookmarks.length)
    {
        let bookmarkIndex = -1;
        for (let i = 0; i < book.bookmarks.length; i++)
        {
            const bookmark = book.bookmarks[i];
            if (bookmark && bookmark.id === bookmarkID)
            {
                bookmarkIndex = i;
                break;
            }
        }

        if (bookmarkIndex !== -1)
        {
            book.bookmarks.splice(bookmarkIndex, 1);
        }

        ipcRenderer.send('remove-bookmark', book.id, bookmarkID);
    }
}

export function addNewBookmark(book: IBook, pagePercent: number, bookPercent: number, bookmarkText: string): void
{
    if (book && book.bookmarks)
    {
        bookmarkText = bookmarkText.trim();

        if (!bookmarkText)
        {
            const date = new Date();
            bookmarkText = `Bookmark ${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`;
        }

        const bookmark: IBookmark = {
            pagePercent: pagePercent,
            bookPercent: bookPercent,
            text: bookmarkText,
            id: generateBookmarkID()
        };

        book.bookmarks.unshift(bookmark);

        ipcRenderer.send('add-new-bookmark', book.id, bookmark);
    }
}