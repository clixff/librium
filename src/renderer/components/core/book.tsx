import { ipcMain } from 'electron/main';
import React from 'react';
import { getBookCoverColor, IBook } from '../../misc/book';
import newTabStyles from '../../styles/modules/newTab.module.css';
import { BookContextMenu } from '../misc/context';
import { EViewType } from '../pages/newTab';

interface IBookCoverProps
{
    cover: string;
    author?: string;
    title: string;
    id: string;
}

export function BookCover(props: IBookCoverProps): JSX.Element
{
    const bUseCustomCover = props.cover === '';
    
    const coverStyleProperties: React.CSSProperties = {};

    
    if (bUseCustomCover)
    {
        coverStyleProperties.backgroundColor = `#${getBookCoverColor(props.id)}`;
    }

    return (<div className={`${newTabStyles['book-cover']} ${bUseCustomCover ? newTabStyles['book-custom-cover'] : ''}`} style={ coverStyleProperties }>
        {
            bUseCustomCover ?
            (
                (<React.Fragment>
                    <div className={newTabStyles['book-cover-title']}>
                        {
                            props.title
                        }
                    </div>
                    <div className={newTabStyles['book-cover-author']}>
                        {
                            props.author || ''
                        }
                    </div>
                    <div className={newTabStyles['book-cover-border']}/>
                </React.Fragment>)
            ) : (
                <img src={`http://127.0.0.1:45506/file/${props.id}/${props.cover}`} />
            )
        }
    </div>);
}

interface IBookElementProps
{
    book: IBook;
    callbacks: IBookCallbacks;
}

interface IBookDataForRender
{
    authorName: string | string;
    allAuthorsNames: string;
    hoverText: string;
}

function getBookDataForRender(book: IBook): IBookDataForRender
{
    const allAuthorsNames = book.authors.join(', ');
    return {
        authorName: book.authors[0],
        allAuthorsNames: allAuthorsNames,
        hoverText: `${book.title} — ${allAuthorsNames}`
    };
}

function handleBookClick(event: React.MouseEvent<HTMLDivElement>, book: IBook, callbacks: IBookCallbacks): void
{
    /**
     * Right mouse button click
     */
    if (event.button === 2)
    {
        const contextMenu = <BookContextMenu book={book} callbacks={callbacks} />;
        callbacks.setContextMenu(contextMenu, event.pageX, event.pageY, 216, 104);
    }
    else
    {
        callbacks.openBook(book.id);
    }

}

function BookCard(props: IBookElementProps): JSX.Element
{
    function handleClick(event: React.MouseEvent<HTMLDivElement>): void
    {
        handleBookClick(event, props.book, props.callbacks);
    }

    const { authorName, hoverText } = getBookDataForRender(props.book);
    return (<div className={newTabStyles['book-card']} title={hoverText} onClick={handleClick} onContextMenu={handleClick}>
        <BookCover cover={props.book.cover} author={authorName} title={props.book.title} id={props.book.id}/>
        <div className={newTabStyles['book-card-info']}>
            <div className={newTabStyles['book-card-title']} >
                {
                    props.book.title
                }
            </div>
            <div className={newTabStyles['book-card-author']}>
                {
                    authorName
                }
            </div>
        </div>
    </div>);
}


function BookListElement(props: IBookElementProps): JSX.Element
{
    function handleClick(event: React.MouseEvent<HTMLDivElement>): void
    {
        handleBookClick(event, props.book, props.callbacks);
    }

    const { allAuthorsNames, hoverText } = getBookDataForRender(props.book);
    return (<div className={newTabStyles['book-list-element']} title={hoverText} onClick={handleClick} onContextMenu={handleClick}>
        <div className={newTabStyles['book-element-wrapper']}>
            <BookCover cover={props.book.cover} id={props.book.id} title={props.book.title} author={props.book.authors[0]} />
            <div className={newTabStyles['book-element-right']}>
                <div className={newTabStyles['book-element-title']}>
                    {
                        props.book.title
                    }
                </div>
                {
                    allAuthorsNames ?
                    (
                        <div className={newTabStyles['book-element-authors']}>
                            {
                                allAuthorsNames
                            }
                        </div>
                    ) : null
                }
                {
                    props.book.publisher ?
                    (
                        <div className={newTabStyles['book-element-publisher']}>
                            {
                                props.book.publisher
                            }
                        </div>
                    ) : null
                }
                <div className={newTabStyles['book-element-percent']}>
                    {
                        `${props.book.percentPages}%`
                    }
                </div>
            </div>
        </div>
    </div>);
}

interface IBooksViewProps
{
    books: Array<IBook>;
    keys: string;
    callbacks: IBookCallbacks;
}

function bAreBooksViewPropsEqual(prevProps: IBooksViewProps, nextProps: IBooksViewProps): boolean
{
    console.log(`prevLength: ${prevProps.books.length}. nextProps: ${nextProps.books.length}. equal: ${prevProps.books === nextProps.books}`);
    return prevProps.keys === nextProps.keys && prevProps.books === nextProps.books && prevProps.books.length === nextProps.books.length;
}

export const BooksGridView = React.memo((props: IBooksViewProps): JSX.Element => 
{
    return (<div className={newTabStyles['grid-view']}>
        {
            props.books.map((book) => 
            {
                return (<BookCard book={book} key={book.id} callbacks={props.callbacks} />);
            })
        }
    </div>);
}, bAreBooksViewPropsEqual);


export const BooksListView = React.memo((props: IBooksViewProps): JSX.Element =>
{
    return (<div className={newTabStyles['list-view']}>
        {
            props.books.map((book) =>
            {
                return (<BookListElement book={book} key={book.id} callbacks={props.callbacks} />);
            })
        }
    </div>);  
}, bAreBooksViewPropsEqual);

export interface IBookCallbacks
{
    setContextMenu: (context: JSX.Element | null, x: number, y: number, width: number, height: number) => void;
    deleteBook: (book: IBook) => void;
    openManageCategoriesMenu: (book: IBook) => void;
    openBook: (bookId: string) => void;
}

export function getBooksViewComponent(viewType: EViewType, books: Array<IBook>, keys: string, callbacks: IBookCallbacks): JSX.Element
{
    const props: IBooksViewProps = {
        books: books,
        keys: keys,
        callbacks: callbacks
    };

    return (viewType === EViewType.Grid ? <BooksGridView {...props} /> : <BooksListView {...props} /> );
}
