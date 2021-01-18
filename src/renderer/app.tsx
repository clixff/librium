import React from 'react';
import ReactDOM from 'react-dom';
import './styles/style.css';
import { ipcRenderer } from 'electron';
import { IBook } from './misc/book';
import { Book } from './components/book';
import { TitleBar } from './components/core/titlebar';

interface IAppState
{
    book: IBook | null;
}

class App extends React.Component<unknown, IAppState>
{
    constructor(props)
    {
        super(props);
        this.handleOpenFileClick = this.handleOpenFileClick.bind(this);
        this.state = {
            book: null
        };
        this.handleBookLoaded = this.handleBookLoaded.bind(this);
    }
    componentDidMount(): void
    {
        ipcRenderer.on('book-loaded', this.handleBookLoaded);
    }
    componentWillUnmount(): void
    {
        ipcRenderer.removeListener('book-loaded', this.handleBookLoaded);
    }
    handleBookLoaded(event, book: IBook): void
    {
        console.log('Book loaded: ', book);
        this.setState({
            book: book
        });
    }
    handleOpenFileClick(): void
    {
        ipcRenderer.send('open-file-click');
    }
    render(): JSX.Element
    {
        return (<React.Fragment>
            <TitleBar />
            <h1> Foo Bar </h1>
            <button onClick={this.handleOpenFileClick}> Open File </button>
            {
                this.state.book ?
                (
                    <Book book={this.state.book} />
                ) : null
            }
        </React.Fragment>);
    }
}

ReactDOM.render(<App />, document.getElementById('root'));