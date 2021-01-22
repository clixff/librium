import React from 'react';
import ReactDOM from 'react-dom';
import './styles/style.css';
import { ipcRenderer } from 'electron';
import { IBook } from './misc/book';
import { Book } from './components/book';
import { TitleBar } from './components/core/titlebar';
import { Provider } from 'react-redux';
import { AppContent } from './components/core/content';
import { ETabType, Tab } from './misc/tabs';
import { ITabsCallbacks } from './components/core/tabs';

interface IAppState
{
    book: IBook | null;
    tabs: Array<Tab>;
    /**
     * Index of the active tab
     */
    activeTab: number;
}

class App extends React.Component<unknown, IAppState>
{
    constructor(props)
    {
        super(props);
        this.handleOpenFileClick = this.handleOpenFileClick.bind(this);
        this.state = {
            book: null,
            tabs: [
                new Tab('New Tab', ETabType.newTab, null, Tab.generateKey('New Tab')),
                new Tab('Lorem ipsum', ETabType.book, 'http://127.0.0.1:45506/file/20a1a56a4f9676486b9cf88f2ef8595fee43c8df/OEBPS%5CA978-1-4842-3366-5_CoverFigure.jpg'),
                new Tab('Dolor sit amet', ETabType.book, 'http://127.0.0.1:45506/file/36e6a91ad0b3f28e016ea685fa7b36a1493bcd02/OPS%5Cimages%5Ccover.jpg'),
                new Tab('Preferences', ETabType.preferences, 'http://127.0.0.1:45506/file/preferences.svg', Tab.generateKey('Preferences')),
            ],
            activeTab: 0
        };
        this.handleBookLoaded = this.handleBookLoaded.bind(this);
        this.handleOpenNewTabButtonClicked = this.handleOpenNewTabButtonClicked.bind(this);
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleCloseTabClicked = this.handleCloseTabClicked.bind(this);
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
    handleOpenNewTabButtonClicked(): void
    {
        this.openNewTab(new Tab('New Tab', ETabType.newTab, null, Tab.generateKey('New Tab')));
    }
    openNewTab(tab: Tab): void
    {
        const tabsCopy = this.state.tabs;
        tabsCopy.push(tab);
        this.setState({ 
            tabs: tabsCopy,
            activeTab: tabsCopy.length - 1
        });
    }
    handleTabClick(tabId: number): void
    {
        if (tabId < this.state.tabs.length && tabId !== this.state.activeTab)
        {
            this.setState({
                activeTab: tabId
            });
        }
    }
    handleCloseTabClicked(tabId: number): void
    {
        if (tabId < this.state.tabs.length && tabId >= 0)
        {
            const tabsList = this.state.tabs;
            tabsList.splice(tabId, 1);


            let newActiveTabIndex = this.state.activeTab;

            if (newActiveTabIndex > tabId)
            {
                newActiveTabIndex--;
            }
            if (newActiveTabIndex >= tabsList.length)
            {
                newActiveTabIndex = tabsList.length - 1;
            }

            this.setState({
                tabs: tabsList,
                activeTab: newActiveTabIndex
            });
        }
    }
    render(): JSX.Element
    {
        const tabsCallbacks: ITabsCallbacks = {
            onOpenNewTabClick: this.handleOpenNewTabButtonClicked,
            onTabClick: this.handleTabClick,
            onTabCloseClick: this.handleCloseTabClicked
        };

        return (
        <React.Fragment>
            <TitleBar tabsList={this.state.tabs} activeTab={this.state.activeTab} tabsCallbacks={ tabsCallbacks } />
            <AppContent />
            {/* <h1> Foo Bar </h1>
            <button onClick={this.handleOpenFileClick}> Open File </button>
            {
                this.state.book ?
                (
                    <Book book={this.state.book} />
                ) : null
            } */}
        </React.Fragment>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));