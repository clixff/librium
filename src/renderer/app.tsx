import React from 'react';
import ReactDOM from 'react-dom';
import './styles/style.css';

class App extends React.Component
{
    render(): JSX.Element
    {
        return (<div>
            <h1> Foo </h1>
        </div>);
    }
}

ReactDOM.render(<App />, document.getElementById('root'));