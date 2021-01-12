import { IBookChunk } from "../../shared/schema";

export interface IBook
{
    title: string;
    authors: Array<string>;
    language: string;
    publisher: string;
    chunks: Array<IBookChunk>;
}