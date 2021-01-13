
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