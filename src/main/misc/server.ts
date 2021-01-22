
import express from 'express';
import path from 'path';
import { getConfig } from '../config';
import fs from 'fs';

const app = express();

/**
 * Send book content by path
 * 
 * @book is book ID
 * @path is relative to the file
 */
app.get('/file/:book/:path', async (req, res) => 
{
    try
    {
        const bookID = req.params.book;
        const filePath = req.params.path;
        if (bookID && filePath && typeof bookID === 'string' && typeof filePath === 'string')
        {
            const bookIDRegex = /^[0-9|a-f]{40}$/;
            if (bookID.length === 40 && bookIDRegex.test(bookID))
            {
                // filePath = filePath.replace(/(\.\.\\)/g, '');
                const booksDirectory = getConfig().booksDir;
                const baseFilePath = path.join(booksDirectory, bookID, 'content');
                const absoluteFilePath: string = path.join(baseFilePath, filePath);
                
                if (!absoluteFilePath.startsWith(baseFilePath))
                {
                    res.sendStatus(400).end();
                    return;
                }

                fs.access(absoluteFilePath, fs.constants.F_OK, (err) =>
                {
                    if (!err)
                    {
                        res.sendFile(absoluteFilePath);
                    }
                    else
                    {
                        res.sendStatus(404).end();
                    }
                });
            }
        }
    }
    catch (error)
    {
        console.error(error);
    }
});

app.get('/file/preferences.svg', async (req, res) => 
{
    try
    {
        res.set('content-type', 'image/svg+xml');
        res.send('<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M7.4 0c-.5 0-.7.3-.8.9v1.3l-.4.2-.6.2a7 7 0 01-.8.3h-.1l-.3-.3c-.4-.6-.7-.8-1-.9-.3 0-.5 0-.9.5l-.7.8v.6l.7.7.4.4v.1c-.4.5-.6 1-.8 1.5l-.1.4h-.7c-.7 0-.9 0-1 .2-.2 0-.2.2-.3.4v1.2c0 .4.2.6.6.7l1 .1H2c.1.5.5 1.3.7 1.5.1.3.2.3.1.4l-.3.3-.7.8c-.2.2-.2.4-.2.6l.8 1 .8.4c.3 0 .5-.3 1-.7 0-.2.6-.7.6-.7h.2c.4.3.8.4 1.3.5l.3.1v1.7c0 .4.1.6.4.7h1.4l.6-.1.2-.6v-1.1V13.5h.2a9.8 9.8 0 001.4-.7l.2.1a31.2 31.2 0 001.4 1.3h.4s.2 0 .3-.2l.7-.6c.3-.3.4-.5.4-.8a1 1 0 00-.2-.4 4.7 4.7 0 00-.8-.7l-.2-.2c-.2-.2-.2-.2 0-.6a5.3 5.3 0 00.6-1.2l.2-.2h1.6c.2 0 .3-.2.4-.3l.1-1-.1-1c-.1-.2-.3-.3-.6-.3H13.8l-.1-.4a2 2 0 00-.3-.6l-.3-.7v-.3l.3-.3c.5-.4.7-.7.8-1v-.3l-.2-.3-.6-.7c-.3-.3-.5-.4-.7-.4-.3 0-.6.2-1 .8-.5.4-.5.5-.7.5l-.3-.2-.6-.2-.7-.3-.1-.5c0-1 0-1.3-.3-1.5C9 0 8.7 0 8.3 0h-.9zm.9 5.7c.5.1 1 .3 1.3.6.3.3.5.7.6 1.2v.7c0 .5-.2.9-.6 1.2a2 2 0 01-.5.4c-.8.3-1.8.3-2.5-.1L6 9.1c-.3-.3-.4-.7-.4-1.2a2 2 0 01.6-1.6 2.5 2.5 0 012-.6z" fill="#888"/></svg>');
    }
    catch (error)
    {
        console.error(error);
    }
});

/**
 * Starts HTTP server that will send the book content from disk
 */
export function startHTTPServer(): Promise<void>
{
    return new Promise((resolve) =>
    {
        app.listen(45506, '127.0.0.1', () => 
        {
            resolve();
        });
    });
}