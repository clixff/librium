import React from 'react';
import ReactDOM from 'react-dom';
import './styles/style.css';
import { ipcRenderer } from 'electron';

class App extends React.Component
{
    constructor(props)
    {
        super(props);
        this.handleOpenFileClick = this.handleOpenFileClick.bind(this);
    }
    handleOpenFileClick(): void
    {
        ipcRenderer.send('open-file-click');
    }
    render(): JSX.Element
    {
        return (<div>
            <h1> Foo </h1>
            <button onClick={this.handleOpenFileClick}> Open File </button>
        </div>);
    }
}

ReactDOM.render(<App />, document.getElementById('root'));