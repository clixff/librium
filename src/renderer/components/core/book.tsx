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

function BookCover(props: IBookCoverProps): JSX.Element
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

interface IBookCardProps
{
    book: IBook;
}

function BookCard(props: IBookCardProps): JSX.Element
{
    const authorName = props.book.authors[0];
    const allAuthorsNames = props.book.authors.join(', ');
    const hoverText = `${props.book.title} — ${allAuthorsNames}`
    return (<div className={newTabStyles['book-card']} title={hoverText}>
        <BookCover cover={props.book.cover} author={props.book.authors[0]} title={props.book.title} id={props.book.id}/>
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

interface IBooksViewProps
{
    books: Array<IBook>;
}

export function BooksGridView(props: IBooksViewProps): JSX.Element
{
    return (<div id={newTabStyles['grid-view']}>
        {
            props.books.map((book) => 
            {
                return (<BookCard book={book}/>);
            })
        }
    </div>);
}

export function BooksListView(props: IBooksViewProps): JSX.Element
{
    return (<div>

    </div>);
}