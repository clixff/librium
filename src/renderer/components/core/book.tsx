import React from 'react';
import { IBook } from '../../misc/book';
import newTabStyles from '../../styles/modules/newTab.module.css';

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

    const customCoverColors = [
        '494036',
        '3A1919',
        '2F402E',
        '274C83',
        '323232',
        '364649',
        '331E31'
    ];
    
    if (bUseCustomCover)
    {
        const firstIdSymbol: number = parseInt(props.id[0] || '', 16);
        const coverColorID = firstIdSymbol % customCoverColors.length;
        const coverColor = customCoverColors[coverColorID];
        coverStyleProperties.backgroundColor = `#${coverColor}`;
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

function BookCard(props: IBookElementProps): JSX.Element
{
    const { authorName, hoverText } = getBookDataForRender(props.book);
    return (<div className={newTabStyles['book-card']} title={hoverText}>
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
    const { allAuthorsNames, hoverText } = getBookDataForRender(props.book);
    return (<div className={newTabStyles['book-list-element']} title={hoverText}>
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
                        `${0}%`
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
}


function bAreBooksViewPropsEqual(prevProps: IBooksViewProps, nextProps: IBooksViewProps): boolean
{
    return prevProps.keys === nextProps.keys && prevProps.books.length === nextProps.books.length;
}

export const BooksGridView = React.memo((props: IBooksViewProps): JSX.Element => 
{
    return (<div className={newTabStyles['grid-view']}>
        {
            props.books.map((book) => 
            {
                return (<BookCard book={book} key={book.id} />);
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
                return (<BookListElement book={book} key={book.id} />);
            })
        }
    </div>);  
}, bAreBooksViewPropsEqual);
