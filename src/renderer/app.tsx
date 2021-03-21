import React from 'react';
import ReactDOM from 'react-dom';
import './styles/style.css';
import { ipcRenderer } from 'electron';
import { addNewBookmark, deleteBook, getBookCustomCoverIconURL, IBook, IBookBase, rawBooksToBooks, rawBookToBook, removeBookmark } from './misc/book';
import { TitleBar } from './components/core/titlebar';
import { TabContent, ITabContentCallbacks } from './components/core/content';
import { ETabType, IBookPageData, IRawTab, loadTab, Tab } from './misc/tabs';
import { ITabsCallbacks } from './components/core/tabs';
import { IRawCategory, ICategory, parseCategories, createCategory, deleteCategory, deleteBookFromCategory, addBookToCategory } from './misc/category';
import { EMenuElementType } from './components/pages/newTab';
import { ContextMenuWrapper } from './components/misc/context';
import { bindFunctionsContext } from './misc/misc';
import { DeletionWarningModal, IModalData, IManageCategoriesItem, ManageCategoriesMenu, EManageCategoriesEventType, AddNewBookmarkModal, BookmarkListModal } from './components/misc/modal';
import { EColorTheme, IPreferences } from '../shared/preferences';
import { fixPreferences, updateBookFontFamily, updateBookFontSize } from './misc/preferences';
import { changeColorTheme, changeSetting } from './components/core/preferences';
import { IBookChunk } from '../shared/schema';

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
    isFullScreen: boolean;
}

export let AppSingleton: App | null = null;

class App extends React.Component<unknown, IAppState>
{
    booksMap: Map<string, IBook> = new Map();
    closingModalTimeout: number | null = null;
    saveTabsTimeout: number | null = null;
    constructor(props)
    {
        super(props);
        this.state = {
            book: null,
            tabs: [
                new Tab('New Tab', ETabType.newTab, null, Tab.generateKey('New Tab'))
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
                fontSize: 16,
                allowCustomColors: false,
                inverseImageColors: false,
                widePages: false
            },
            isFullScreen: false
        };

        bindFunctionsContext(this, ['handleBookLoaded', 'handleOpenNewTabButtonClicked', 'handleTabClick',
        'handleCloseTabClicked', 'handlePreferencesClick', 'handleCategoryDeleteClick',
        'deleteCategory', 'setContextMenu', 'removeContextMenu', 'handleScroll',
        'deleteBook', 'openDeletionBookWarning', 'openModal', 'closeModal', 'removeModal',
        'createCategory', 'openManageCategoriesMenu', 'handleManageCategoriesEvent',
        'changeSetting', 'openBook', 'loadBookChunks', 'updateBookLastTImeOpenedTime',
        'updateBookTabState', 'updateBookReadPercent', 'handleTabsLoaded',
        'saveTabs', 'openBookAlreadyLoaded', 'changeFullScreenMode', 'handleKeyUp',
        'openNewBookmarkModal', 'openBookmarkListModal']);

        AppSingleton = this;
    }
    componentDidMount(): void
    {
        ipcRenderer.on('book-loaded', this.handleBookLoaded);


        ipcRenderer.invoke('load-saved-books').then((result: [Array<IBookBase>, Array<IRawCategory>]) => 
        {
            const loadedBooks: Array<IBook> = this.sortSavedBooks(rawBooksToBooks(result[0], this.booksMap));
            const categories = parseCategories(result[1], this.booksMap);
            this.setState({
                savedBooks: loadedBooks,
                categories: categories
            }, () =>
            {
                ipcRenderer.invoke('load-tabs').then(this.handleTabsLoaded).then(() =>
                {
                    ipcRenderer.send('load-book-from-argv');
                });
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

            updateBookFontFamily(preferences.fontFamily || '');

            updateBookFontSize(preferences.fontSize || 16);

            this.setState({
                preferences: preferences
            });
        });

        window.addEventListener('wheel', this.handleScroll);
        window.addEventListener('keyup', this.handleKeyUp);
        
        ipcRenderer.addListener('open-book-already-loaded', this.openBookAlreadyLoaded);

        ipcRenderer.invoke('get-argv').then((argv) => 
        {
            console.log(`argv is `, argv);
        });
    }
    componentWillUnmount(): void
    {       
        ipcRenderer.removeListener('book-loaded', this.handleBookLoaded);
        window.removeEventListener('wheel', this.handleScroll);
        window.removeEventListener('keyup', this.handleKeyUp);
        ipcRenderer.removeListener('open-book-already-loaded', this.openBookAlreadyLoaded);

        if (this.saveTabsTimeout && window)
        {
            window.clearTimeout(this.saveTabsTimeout);
            this.saveTabsTimeout = null;
        }
    }
    openBookmarkListModal(): void
    {
        const activeTab = this.state.tabs[this.state.activeTab];

        if (!activeTab || activeTab.type !== ETabType.book || !activeTab.state || !activeTab.state.data || !activeTab.state.book)
        {
            return;
        }

        const activeBook = activeTab.state.book;
        const bookData = activeTab.state.data;

        if (!bookData.scrollToPercent)
        {
            return;
        }

        const deleteBookmark = (bookmarkID: string) => 
        {
            if (activeBook)
            {
                removeBookmark(activeBook, bookmarkID);

                this.setState({
                    savedBooks: this.state.savedBooks
                });
            }
        };
        

        this.openModal(<BookmarkListModal list={activeBook.bookmarks} totalNumberOfPages={bookData.totalNumberOfPages} deleteBookmark={deleteBookmark} scrollToPercent={bookData.scrollToPercent}   closeModal={this.closeModal}/>);
    }
    openNewBookmarkModal(): void
    {
        const handleAddClick = (bookmarkName: string) =>
        {
            const activeTab = this.state.tabs[this.state.activeTab];
            if (activeTab && activeTab.type === ETabType.book)
            {
                if (!activeTab.state || !activeTab.state.book || !activeTab.state.data)
                {
                    return;
                }

                const bookData = activeTab.state.data;

                const bookmarkPagePercent = bookData.currentPage / bookData.totalNumberOfPages;
                const bookmarkBookPercent = bookData.percentReadToSave;

                addNewBookmark(activeTab.state.book, bookmarkPagePercent, bookmarkBookPercent, bookmarkName);
                this.setState((prevState) => 
                {
                    return ({
                        savedBooks: prevState.savedBooks
                    });
                });
            }
        };

        this.openModal(<AddNewBookmarkModal closeModal={this.closeModal} addBookmark={handleAddClick} />);
    }
    handleKeyUp(event: KeyboardEvent): void
    {
        if (event.code === 'F11')
        {
            this.changeFullScreenMode();
        }
        else if (event.code === 'Escape')
        {
            if (!this.state.modal.element && this.state.isFullScreen)
            {
                ipcRenderer.send('change-full-screen-mode', false);
                
                this.setState({
                    isFullScreen: false
                });
            }
        }
    }
    changeFullScreenMode(): void
    {
        this.setState((prevState) =>
        {
            const newFullScreenState = !prevState.isFullScreen;

            ipcRenderer.send('change-full-screen-mode', newFullScreenState);

            return ({
                isFullScreen: newFullScreenState
            });
        });
    }
    openBookAlreadyLoaded(event, bookID: string): void
    {
        this.openBook(bookID, true);
    }
    /**
     * Exports tabs list to the main process, then saves it to disk before app quit
     */
    saveTabs(bForce = false): void
    {
        if ((!this.saveTabsTimeout || bForce) && window)
        {
            if (bForce && this.saveTabsTimeout)
            {
                window.clearTimeout(this.saveTabsTimeout);
                this.saveTabsTimeout = null;
            }
            this.saveTabsTimeout = window.setTimeout(() =>
            {
                if (this.saveTabsTimeout)
                {
                    window.clearTimeout(this.saveTabsTimeout);
                    this.saveTabsTimeout = null;
                }

                console.log(`Save tabs`);
                const oldTabs = [...this.state.tabs];
                const tabsToSave: Array<Record<string, unknown | Record<string, unknown>>> = [];
        
                for (let i = 0; i < oldTabs.length; i++)
                {
                    const oldTab = {...oldTabs[i]};
                    const tabToSave: Record<string, unknown | Record<string, unknown>> = {
                        name: oldTab.name,
                        type: oldTab.type,
                        icon: oldTab.icon,
                        key: oldTab.key,
                        state: oldTab.state ? {...oldTab.state}: oldTab.state 
                    };
        
                    if (oldTab.state && tabToSave.state)
                    {
                        const tabState = tabToSave.state as Record<string, unknown>;
        
                        if (tabState.book)
                        {
                            delete tabState.book;
                        }
        
                        if (oldTab.state.data && tabState.data)
                        {
                            tabState.data = {...oldTab.state.data};
                            const tabStateBookData = tabState.data as Record<string, unknown>;
                            tabStateBookData.bookWrapper = null;
                            tabStateBookData.totalNumberOfPages = 0;
                            tabStateBookData.currentPage = 0;
                            tabStateBookData.bookHeight = 0;
                            tabStateBookData.bookPageHeight = 0;
                            tabStateBookData.bookContainerMarginBottom = 0;
                            tabStateBookData.backToPagePercentOfBook = -1;
                            tabStateBookData.backToPagePercentOfPages = 0;
                            tabStateBookData.currentNavigationItem = '';
                            tabStateBookData.tableOfContents = [];
                            tabStateBookData.tableOfContentsItems = [];
                            tabStateBookData.scrollToPercent = null;
                        }
                    }
        
                    tabsToSave.push(tabToSave);
                }
                ipcRenderer.send('save-tabs', tabsToSave, this.state.activeTab);
            }, bForce ? 0 : 5000);
        }
    }
    handleTabsLoaded(tabsData: { tabs: Array<IRawTab>, active: number }): Promise<void>
    {
        return new Promise((resolve) =>
        {
            if (tabsData.tabs.length)
            {
                const newTabsList: Array<Tab> = [];
                let newActiveTabIndex = tabsData.active;
                for (let i = 0; i < tabsData.tabs.length; i++)
                {
                    const rawTab = tabsData.tabs[i];

                    if (!rawTab)
                    {
                        continue;
                    }

                    const tab = loadTab(rawTab);
                    let bAddTab = true;

                    if (tab.type === ETabType.book)
                    {
                        if (tab.state && tab.state.bookId)
                        {
                            const bookInTab = this.booksMap.get(tab.state.bookId);

                            /**
                             * Do not add this tab if book not found
                             */
                            if (!bookInTab)
                            {
                                continue;
                            }
                            tab.state.book = bookInTab;

                            if (tab.state.data)
                            {
                                tab.state.data.percentReadToSave = bookInTab.percentRead;
                            }
                        }
                        else
                        {
                            bAddTab = false;
                        }
                    }

                    if (bAddTab)
                    {
                        newTabsList.push(tab);
                    }
                }
    
                if (newActiveTabIndex < 0 || newActiveTabIndex >= newTabsList.length)
                {
                    newActiveTabIndex = 0;
                }
    
                this.setState({
                    tabs: newTabsList,
                    activeTab: newActiveTabIndex
                }, resolve);
            }
            else
            {
                resolve();
            }
        });
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

        this.openBook(book.id, false);
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
        }, this.saveTabs);
    }
    handleTabClick(tabId: number): void
    {
        if (tabId < this.state.tabs.length && tabId !== this.state.activeTab)
        {
            this.setState({
                activeTab: tabId,
                modal: this.getClosedModalObject()
            }, this.saveTabs);
        }
    }
    handleCloseTabClicked(tabId: number): void
    {
        if (tabId < this.state.tabs.length && tabId >= 0)
        {
            const tabsList = [...this.state.tabs];
            
            const tabToClose = tabsList[tabId];
            if (tabToClose && tabToClose.type === ETabType.book)
            {
                if (tabToClose.state && tabToClose.state.book)
                {
                    /**
                     * Remove chunks from the closed book
                     */
                    tabToClose.state.book.chunks = [];

                    console.log(`update book ${tabToClose.state.book.id} percent to ${tabToClose.state.book.percentRead} and ${tabToClose.state.book.percentPages}`);

                    ipcRenderer.send('update-book-read-percent', tabToClose.state.book.id, tabToClose.state.book.percentRead, tabToClose.state.book.percentPages, true);
                }
            }

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
            }, () => 
            {
                this.saveTabs(!this.state.tabs.length);
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
        }, this.saveTabs);
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

            let tabsList = this.state.tabs;
            let activeTabIndex = this.state.activeTab;

            for (let i = 0; i < tabsList.length; i++)
            {
                const tab = tabsList[i];

                /**
                 * Find a tab with this book
                 */
                if (tab && tab.type === ETabType.book && tab.state && tab.state.bookId === book.id)
                {
                    tabsList = [...tabsList];
                    tabsList.splice(i, 1);

                    if (activeTabIndex > i)
                    {
                        activeTabIndex--;
                    }
                    
                    break;
                }
            }

            deleteBook(book);

            this.setState({
                savedBooks: booksList,
                tabs: tabsList,
                activeTab: activeTabIndex
            }, this.saveTabs);
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
    changeSetting(id: string, value: unknown, saveToDisk = true): void
    {
        const preferences = this.state.preferences;
        if (saveToDisk)
        {
            changeSetting(preferences, id, value);
        }
        this.setState({
            preferences: preferences
        });
    }
    /**
     * @param bUpdateTime Should the last time book opened param be updated?
     */
    openBook(bookId: string, bUpdateTime = true): void
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
            const bookCover = savedBook.cover ? `http://127.0.0.1:45506/file/${savedBook.id}/${savedBook.cover}` : getBookCustomCoverIconURL(bookId);
            tabsList.splice(bookTabId, 0, new Tab(savedBook.title, ETabType.book, bookCover));
        }

        const bookTab = tabsList[bookTabId];

        if (bookTab.state)
        {
            bookTab.state.book = savedBook;
            bookTab.state.bookId = bookId;
            if (bookTab.state.data)
            {
                bookTab.state.data.percentReadToSave = savedBook.percentRead;
            }
        }

        this.setState({
            tabs: tabsList,
            activeTab: bookTabId
        }, this.saveTabs);

        if (bUpdateTime)
        {
            this.updateBookLastTImeOpenedTime(bookId);
        }
    }
    updateBookLastTImeOpenedTime(bookId: string): void
    {
        const book = this.booksMap.get(bookId);
        if (book)
        {
            book.lastTimeOpened = Math.floor(Date.now() / 1000);
            const savedBooks = [...this.state.savedBooks];
            this.sortSavedBooks(savedBooks);
            this.setState({ 
                savedBooks: savedBooks
            });

            ipcRenderer.send('update-book-last-time-opened-time', bookId, book.lastTimeOpened);
        }
    }
    loadBookChunks(book: IBook): void
    {
        const onSuccess = (): void =>
        {
            /**
             * Force re-render book page with new chunks
             */
            this.setState({
                savedBooks: this.state.savedBooks
            });
        };

        /**
         * Book chunks already loaded
         */
        if (book.chunks.length)
        {
            onSuccess();
            return;
        }
        
        ipcRenderer.invoke('load-book-chunks', book.id).then((chunks: Array<IBookChunk>) =>
        {
            book.chunks = chunks;
            onSuccess();
        });
    }
    updateBookTabState(data: Partial<IBookPageData>): void
    {
        const activeTab = this.state.tabs[this.state.activeTab];
        if (activeTab && activeTab.type === ETabType.book)
        {
            if (activeTab.state && activeTab.state.data)
            {
                // console.log(`Update book data`, data);
                activeTab.state.data = {
                    ...activeTab.state.data,
                    ...data
                };

                this.setState((prevState) =>
                {
                    return {
                        tabs: prevState.tabs
                    };
                }, this.saveTabs);
            }
        }
    }
    updateBookReadPercent(book: IBook, percent: number, percentPages: number): void
    {
        if (percent < 0 || !isFinite(percent))
        {
            percent = 0;
        }
        else if (percent > 1)
        {
            percent = 1;
        }

        if (percentPages < 0 || !isFinite(percentPages))
        {
            percentPages = 0;
        }
        else if (percentPages > 100)
        {
            percentPages = 100;
        }

        book.percentRead = percent;
        book.percentPages = percentPages;
        ipcRenderer.send('update-book-read-percent', book.id, percent, percentPages, false);
        this.saveTabs();
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
            },
            bookPageCallbacks: {
                loadBookChunks: this.loadBookChunks,
                updateBookTabState: this.updateBookTabState,
                updateBookReadPercent: this.updateBookReadPercent,
                openModal: this.openModal,
                closeModal: this.closeModal
            }
        };

        let activeBook: IBook | null = null;

        const activeTab = this.state.tabs[this.state.activeTab];
        if (activeTab && activeTab.type === ETabType.book && activeTab.state && activeTab.state.book)
        {
            activeBook = activeTab.state.book;
        }

        return (
        <React.Fragment>
            {
                this.state.isFullScreen ? null :
                (
                <TitleBar tabsList={this.state.tabs} activeTab={this.state.activeTab} tabsCallbacks={ tabsCallbacks } />
                )
            }
            <TabContent tabsList={this.state.tabs} activeTab={this.state.activeTab} callbacks={tabContentCallback} savedBooks={this.state.savedBooks} categories={this.state.categories} modal={this.state.modal} preferences={this.state.preferences} closeModal={this.closeModal} book={activeBook} isFullScreen={this.state.isFullScreen} />
            {
                this.state.contextMenu && this.state.contextMenu.element ?
                <ContextMenuWrapper x={this.state.contextMenu.x} y={this.state.contextMenu.y} removeContextMenu={this.removeContextMenu} >
                    {
                        this.state.contextMenu.element
                    }
                </ContextMenuWrapper> : null
            }
        </React.Fragment>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));