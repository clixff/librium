import React from 'react';
import ReactDOM from 'react-dom';
import './styles/style.css';
import { ipcRenderer } from 'electron';
import { deleteBook, IBook, IBookBase, rawBooksToBooks, rawBookToBook } from './misc/book';
import { Book } from './components/book';
import { TitleBar } from './components/core/titlebar';
import { TabContent, ITabContentCallbacks } from './components/core/content';
import { ETabType, Tab } from './misc/tabs';
import { ITabsCallbacks } from './components/core/tabs';
import { IRawCategory, ICategory, parseCategories } from './misc/category';
import { EMenuElementType } from './components/pages/newTab';
import { ContextMenuWrapper } from './components/misc/context';
import { bindFunctionsContext } from './misc/misc';
import { DeletionWarningModal, IModalData } from './components/misc/modal';

interface IAppState
{
    book: IBook | null;
    tabs: Array<Tab>;
    /**
     * Index of the active tab
     */
    activeTab: number;
    savedBooks: Array<IBook>;
    categories: Array<ICategory>;
    contextMenu: {
        element: JSX.Element | null;
        /**
         * X position on the screen
         */
        x: number;
        /**
         * Y position on the screen
         */
        y: number;
    },
    modal: IModalData;
}

class App extends React.Component<unknown, IAppState>
{
    booksMap: Map<string, IBook> = new Map();
    constructor(props)
    {
        super(props);
        this.state = {
            book: null,
            tabs: [
                new Tab('New Tab', ETabType.newTab, null, Tab.generateKey('New Tab')),
                new Tab('Lorem ipsum', ETabType.book, 'http://127.0.0.1:45506/file/20a1a56a4f9676486b9cf88f2ef8595fee43c8df/OEBPS%5CA978-1-4842-3366-5_CoverFigure.jpg'),
                new Tab('Dolor sit amet', ETabType.book, 'http://127.0.0.1:45506/file/36e6a91ad0b3f28e016ea685fa7b36a1493bcd02/OPS%5Cimages%5Ccover.jpg'),
                new Tab('Preferences', ETabType.preferences, 'http://127.0.0.1:45506/file/preferences.svg', Tab.generateKey('Preferences')),
            ],
            activeTab: 0,
            savedBooks: [],
            categories: [],
            contextMenu: {
                element: null,
                x: 0,
                y: 0
            },
            modal: {
                element: null,
                createdAt: 0
            }
        };

        bindFunctionsContext(this, ['handleBookLoaded', 'handleOpenNewTabButtonClicked', 'handleTabClick',
        'handleCloseTabClicked', 'handlePreferencesClick', 'handleCategoryDeleteClick',
        'deleteCategory', 'setContextMenu', 'removeContextMenu', 'handleScroll',
        'deleteBook', 'openDeletionBookWarning', 'openModal', 'closeModal']);
    }
    componentDidMount(): void
    {
        ipcRenderer.on('book-loaded', this.handleBookLoaded);
        ipcRenderer.invoke('load-saved-books').then((result: [Array<IBookBase>, Array<IRawCategory>]) => 
        {
            const loadedBooks: Array<IBook> = this.sortSavedBooks(rawBooksToBooks(result[0], this.booksMap));
            console.log(`Loaded books: `, loadedBooks);
            console.log(this.booksMap);
            const categories = parseCategories(result[1], this.booksMap);
            this.setState({
                savedBooks: loadedBooks,
                categories: categories
            });
        });

        window.addEventListener('wheel', this.handleScroll);
    }
    componentWillUnmount(): void
    {
        ipcRenderer.removeListener('book-loaded', this.handleBookLoaded);
        window.removeEventListener('wheel', this.handleScroll);
    }
    handleScroll(): void
    {
        if (this.state.contextMenu && this.state.contextMenu.element)
        {
            this.removeContextMenu();
        }
    }
    handleBookLoaded(event, rawBook: IBookBase): void
    {
        console.log('Book loaded: ', rawBook);

        let savedBooks = [...this.state.savedBooks];

        const book = rawBookToBook(rawBook);

        this.booksMap.set(book.id, book);

        savedBooks.push(book);

        savedBooks = this.sortSavedBooks(savedBooks);
        
        this.setState({
            savedBooks: savedBooks
        });
    }
    handleOpenNewTabButtonClicked(): void
    {
        this.openNewTab(new Tab('New Tab', ETabType.newTab, null, Tab.generateKey('New Tab')));
    }
    openNewTab(tab: Tab): void
    {
        const tabsCopy = [...this.state.tabs];
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
                activeTab: tabId,
                modal: {
                    element: null,
                    createdAt: 0
                }
            });
        }
    }
    handleCloseTabClicked(tabId: number): void
    {
        if (tabId < this.state.tabs.length && tabId >= 0)
        {
            const tabsList = [...this.state.tabs];
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
    /**
     * Opens preferences tab
     */
    handlePreferencesClick(): void
    {
        let tabsList = this.state.tabs;
        const activeTab = tabsList[this.state.activeTab];
        if (activeTab.type === ETabType.preferences)
        {
            return;
        }

        let preferencesTabId = -1;
        /**
         * Check if preferences tab already exists
         */
        for (let i = 0; i < tabsList.length; i++)
        {
            const tab = tabsList[i];
            if (tab.type === ETabType.preferences)
            {
                preferencesTabId = i;
                break;
            }
        }

        /**
         * If preferences tab not found, create it
         */
        if (preferencesTabId === -1)
        {
            const preferencesTab = new Tab('Preferences', ETabType.preferences, 'http://127.0.0.1:45506/file/preferences.svg', Tab.generateKey('Preferences'));
            preferencesTabId = this.state.activeTab + 1;
            tabsList.splice(preferencesTabId, 0, preferencesTab);
            tabsList = [...tabsList];
        }

        this.setState({
            tabs: tabsList,
            activeTab: preferencesTabId,
            modal: {
                element: null,
                createdAt: 0
            }
        });
    }
    sortSavedBooks(savedBooks: Array<IBook>): Array<IBook>
    {
        savedBooks.sort((a, b) =>
        {
            if (a.lastTimeOpened < b.lastTimeOpened)
            {
                return 1;
            }
            else if (a.lastTimeOpened > b.lastTimeOpened)
            {
                return -1;
            }

            return 0;
        });
        return savedBooks;
    }
    handleCategoryDeleteClick(categoryId: number): void
    {
        /**
         * TODO: Open dialog with the confirmation
         */
        this.deleteCategory(categoryId);
    }
    deleteCategory(categoryId: number): void
    {
        const CategoriesList = this.state.categories;
        if (CategoriesList[categoryId])
        {
            CategoriesList.splice(categoryId, 1);
            
            const tabsList = this.state.tabs;

            /**
             * Fix categories IDs in tab states
             */
            for (let i = 0; i < tabsList.length; i++)
            {
                const tab = tabsList[i];
                if (tab.type === ETabType.newTab)
                {
                    if (tab.state && tab.state.menu === EMenuElementType.Categories)
                    {
                        /**
                         * If there's a tab with category that needs to be removed, return to the list of categories in this tab
                         */
                        if (tab.state.activeCategory === categoryId)
                        {
                            tab.state.activeCategory = -1;
                        } 
                        else if (tab.state.activeCategory > categoryId)
                        {
                            tab.state.activeCategory--;
                        }
                    }
                }
            }

            this.setState({
                categories: CategoriesList
            });
        }
    }
    openDeletionBookWarning(book: IBook): void
    {
        this.openModal(<DeletionWarningModal />);
        // /**
        //  * TODO: Open a dialog with the book deletion warning
        //  */
        // this.deleteBook(book);

    }
    deleteBook(book: IBook): void
    {
        if (book)
        {
            let booksList = this.state.savedBooks;
            for (let i = 0; i < booksList.length; i++)
            {
                const tempBook = booksList[i];
                if (tempBook.id === book.id)
                {
                    booksList.splice(i, 1);
                    break;
                }
            }

            booksList = [...booksList];

            this.booksMap.delete(book.id);

            deleteBook(book);

            this.setState({
                savedBooks: booksList
            });
        }
    }
    setContextMenu(contextMenu: JSX.Element | null, posX: number, posY: number, width: number, height: number): void
    {
        if (window)
        {
            const windowWidth: number = window.innerWidth - 20;
            const windowHeight: number = window.innerHeight - 20;

            const contextMenuRightCoord = posX + width;
            const contextMenuBottomCoord = posY + height;

            if (contextMenuRightCoord > windowWidth)
            {
                posX -= contextMenuRightCoord - windowWidth;
            }

            if (contextMenuBottomCoord > windowHeight)
            {
                posY -= contextMenuBottomCoord - windowHeight;
            }
        }

        this.setState({
            contextMenu: {
                element: contextMenu,
                x: posX,
                y: posY
            }
        });
    }
    removeContextMenu(): void
    {
        console.log(`Removing context menu`);
        this.setContextMenu(null, 0, 0, 0, 0);
    }
    openModal(modal: JSX.Element | null): void
    {
        this.setState({
            modal: {
                element: modal,
                createdAt: Date.now()
            }
        });
    }
    closeModal(): void
    {
        this.openModal(null);
    }
    render(): JSX.Element
    {
        const tabsCallbacks: ITabsCallbacks = {
            onOpenNewTabClick: this.handleOpenNewTabButtonClicked,
            onTabClick: this.handleTabClick,
            onTabCloseClick: this.handleCloseTabClicked
        };

        const tabContentCallback: ITabContentCallbacks = {
            onPreferencesClick: this.handlePreferencesClick,
            onCategoryDelete: this.handleCategoryDeleteClick,
            newTabBooksCallbacks: {
                setContextMenu: this.setContextMenu,
                deleteBook: this.openDeletionBookWarning
            }
        };

        return (
        <React.Fragment>
            <TitleBar tabsList={this.state.tabs} activeTab={this.state.activeTab} tabsCallbacks={ tabsCallbacks } />
            <TabContent tabsList={this.state.tabs} activeTab={this.state.activeTab} callbacks={tabContentCallback} savedBooks={this.state.savedBooks} categories={this.state.categories} modal={this.state.modal} closeModal={this.closeModal} />
            {
                this.state.contextMenu && this.state.contextMenu.element ?
                <ContextMenuWrapper x={this.state.contextMenu.x} y={this.state.contextMenu.y} removeContextMenu={this.removeContextMenu} >
                    {
                        this.state.contextMenu.element
                    }
                </ContextMenuWrapper> : null
            }
            {/*
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