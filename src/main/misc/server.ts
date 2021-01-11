
import express from 'express';
import path from 'path';
import { getConfig } from '../config';
import fs from 'fs';

const app = express();

app.get('/file/:book/:path', async (req, res) => 
{
    try
    {
        const bookID = req.params.book;
        let filePath = req.params.path;
        if (bookID && filePath && typeof bookID === 'string' && typeof filePath === 'string')
        {
            const bookIDRegex = /^[0-9|a-f]{40}$/;
            if (bookID.length === 40 && bookIDRegex.test(bookID))
            {
                filePath = filePath.replace(/(\.\.\\)/g, '');
                const booksDirectory = getConfig().booksDir;
                const absoluteFilePath: string = path.join(booksDirectory, bookID, 'content', 'misc', filePath);

                fs.access(absoluteFilePath, fs.constants.F_OK, (err) =>
                {
                    if (!err)
                    {
                        res.sendFile(absoluteFilePath);
                    }
                    else
                    {
                        res.sendStatus(400).end();
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