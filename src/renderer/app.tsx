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
import { IRawCategory, ICategory, parseCategories, createCategory, deleteCategory, deleteBookFromCategory, addBookToCategory } from './misc/category';
import { EMenuElementType } from './components/pages/newTab';
import { ContextMenuWrapper } from './components/misc/context';
import { bindFunctionsContext } from './misc/misc';
import { DeletionWarningModal, IModalData, IManageCategoriesItem, ManageCategoriesMenu, EManageCategoriesEventType } from './components/misc/modal';
import { EColorTheme, IPreferences } from '../shared/preferences';
import { fixPreferences } from './misc/preferences';
import { changeColorTheme, changeSetting } from './components/core/preferences';


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
    preferences: IPreferences;
}

class App extends React.Component<unknown, IAppState>
{
    booksMap: Map<string, IBook> = new Map();
    closingModalTimeout: number | null = null;
    constructor(props)
    {
        super(props);
        this.state = {
            book: null,
            tabs: [
                new Tab('New Tab', ETabType.newTab, null, Tab.generateKey('New Tab')),
                new Tab('Lorem ipsum', ETabType.book, 'http://127.0.0.1:45506/file/20a1a56a4f9676486b9cf88f2ef8595fee43c8df/OEBPS%5CA978-1-4842-3366-5_CoverFigure.jpg'),
                new Tab('Dolor sit amet', ETabType.book, 'http://127.0.0.1:45506/file/36e6a91ad0b3f28e016ea685fa7b36a1493bcd02/OPS%5Cimages%5Ccover.jpg')
            ],
            activeTab: 0,
            savedBooks: [],
            categories: [],
            contextMenu: {
                element: null,
                x: 0,
                y: 0
            },
            modal: this.getClosedModalObject(),
            preferences: 
            {
                booksDir: '',
                colorTheme: EColorTheme.Dark,
                fontFamily: '',
                fontSize: 16
            }
        };

        bindFunctionsContext(this, ['handleBookLoaded', 'handleOpenNewTabButtonClicked', 'handleTabClick',
        'handleCloseTabClicked', 'handlePreferencesClick', 'handleCategoryDeleteClick',
        'deleteCategory', 'setContextMenu', 'removeContextMenu', 'handleScroll',
        'deleteBook', 'openDeletionBookWarning', 'openModal', 'closeModal', 'removeModal',
        'createCategory', 'openManageCategoriesMenu', 'handleManageCategoriesEvent',
        'changeSetting', 'openBook']);
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


        ipcRenderer.invoke('load-preferences').then((preferences: IPreferences | null): void =>
        {
            if (!preferences)
            {
                return;
            }

            preferences = fixPreferences(preferences);

            changeColorTheme(preferences.colorTheme);

            this.setState({
                preferences: preferences
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
                modal: this.getClosedModalObject()
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
            modal: this.getClosedModalObject()
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
        const category = this.state.categories[categoryId];
        if (!category)
        {
            return;
        }

        let categoryName = category.name.trim();
        
        const maxTitleLength = 40;

        if (categoryName.length > maxTitleLength)
        {
            categoryName = `${categoryName.slice(0, maxTitleLength-3).trim()}...`;
        }

        const warningText = `Are you sure you want to delete the category "${categoryName}"?`;

        const handleDeleteClick = () => 
        {
            this.deleteCategory(categoryId);
        };

        this.openModal(<DeletionWarningModal text={warningText} onDeleteClick={handleDeleteClick} closeModal={this.closeModal} />);
    }
    deleteCategory(categoryId: number): void
    {
        const CategoriesList = this.state.categories;
        const categoryToDelete = CategoriesList[categoryId];
        if (categoryToDelete)
        {
            CategoriesList.splice(categoryId, 1);
            
            const tabsList = this.state.tabs;
            
            deleteCategory(categoryToDelete);

            /**
             * Fix categories IDs in tab states
             */
            for (let i = 0; i < tabsList.length; i++)
            {
                const tab = tabsList[i];
                if (tab.type === ETabType.newTab)
                {
                    if (tab.state && tab.state.menu === EMenuElementType.Categories && tab.state.activeCategory !== undefined)
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
        let bookTitle = book.title.trim();
        
        const maxTitleLength = 40;

        if (bookTitle.length > maxTitleLength)
        {
            bookTitle = `${bookTitle.slice(0, maxTitleLength-3).trim()}...`;
        }

        const warningText = `Are you sure you want to delete the book "${bookTitle}"?`;

        const handleDeleteClick = () => 
        {
            this.deleteBook(book);
        };

        this.openModal(<DeletionWarningModal text={warningText} onDeleteClick={handleDeleteClick} closeModal={this.closeModal} />);
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
                createdAt: Date.now(),
                isClosing: false
            }
        });

        if (this.closingModalTimeout)
        {
            window.clearTimeout(this.closingModalTimeout);
            this.closingModalTimeout = null;
        }
    }
    closeModal(): void
    {
        const modal = this.state.modal;

        /**
         * If modal is already closing
         */
        if (this.closingModalTimeout || !modal.element || modal.isClosing)
        {
            return;
        }
        
        this.setState({
            modal: {
                ...modal,
                isClosing: true
            }
        });

        if (!window)
        {
            return;
        }

        this.closingModalTimeout = window.setTimeout(() =>
        {
            this.removeModal();
            if (this.closingModalTimeout)
            {
                window.clearTimeout(this.closingModalTimeout);
                this.closingModalTimeout = null;
            }
        }, 1250);
    }
    removeModal(): void
    {
        this.openModal(null);
    }
    getClosedModalObject(): IModalData
    {
        return {
            element: null,
            createdAt: 0,
            isClosing: false
        };
    }
    createCategory(): void
    {
        const category = createCategory();

        const categoriesList = this.state.categories;

        categoriesList.unshift(category);

        this.setState({
            categories: categoriesList
        });
    }
    openManageCategoriesMenu(book: IBook): void
    {
        if (book)
        {
            const categoriesList = this.state.categories;
            const categoriesItems: Array<IManageCategoriesItem> = [];
            const bookCategoriesIds: Array<string> = [];

            for (let i = 0; i < book.categories.length; i++)
            {
                const category = book.categories[i];
                bookCategoriesIds.push(category.id);
            }

            for (let i = 0; i < categoriesList.length; i++)
            {
                const category = categoriesList[i];
                const categoryItem: IManageCategoriesItem = {
                    category: category,
                    isActive: bookCategoriesIds.includes(category.id)
                };

                categoriesItems.push(categoryItem);
            }

            const handleEvent = (category: ICategory, type: EManageCategoriesEventType): void =>
            {
                this.handleManageCategoriesEvent(book, category, type);
            };

            const menuElement = <ManageCategoriesMenu categories={categoriesItems} closeModal={this.closeModal} onManageCategoriesEvent={handleEvent} />;

            this.openModal(menuElement);
        }
    }
    /**
     * When book is added to the category or deleted from the category
     */
    handleManageCategoriesEvent(book: IBook, category: ICategory, type: EManageCategoriesEventType): void
    {
        if (type === EManageCategoriesEventType.Add)
        {
            addBookToCategory(category, book);
        }
        else
        {
            deleteBookFromCategory(category, book);
        }

        /**
         * If user is viewing a category, books in this category will update
         */
        this.setState({
            categories: this.state.categories
        });
    }
    /**
     * 
     * @param id Setting ID 
     */
    changeSetting(id: string, value: unknown): void
    {
        const preferences = this.state.preferences;
        changeSetting(preferences, id, value);
        this.setState({
            preferences: preferences
        });
    }
    openBook(bookId: string): void
    {
        const savedBook: IBook | undefined = this.booksMap.get(bookId);
        if (!savedBook)
        {
            return;
        }

        const tabsList = this.state.tabs;
        let bookTabId = -1;

        for (let i = 0; i < tabsList.length; i++)
        {
            const tab = tabsList[i];
            if (tab && tab.type === ETabType.book)
            {
                if (tab.state && tab.state.bookId === bookId)
                {
                    bookTabId = i;
                    break;
                }
            }
        }

        if (bookTabId === -1)
        {
            bookTabId = this.state.activeTab + 1;
        }

        tabsList.splice(bookTabId, 0, new Tab(savedBook.title, ETabType.book, `http://127.0.0.1:45506/file/${savedBook.id}/${savedBook.cover}`));

        const bookTab = tabsList[bookTabId];

        bookTab.state = {
            bookId: bookId
        };

        this.setState({
            tabs: tabsList,
            activeTab: bookTabId
        });

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
            createCategory: this.createCategory,
            newTabBooksCallbacks: {
                setContextMenu: this.setContextMenu,
                deleteBook: this.openDeletionBookWarning,
                openManageCategoriesMenu: this.openManageCategoriesMenu,
                openBook: this.openBook
            },
            preferencesCallbacks: {
                changeSetting: this.changeSetting
            }
        };

        return (
        <React.Fragment>
            <TitleBar tabsList={this.state.tabs} activeTab={this.state.activeTab} tabsCallbacks={ tabsCallbacks } />
            <TabContent tabsList={this.state.tabs} activeTab={this.state.activeTab} callbacks={tabContentCallback} savedBooks={this.state.savedBooks} categories={this.state.categories} modal={this.state.modal} preferences={this.state.preferences} closeModal={this.closeModal} />
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