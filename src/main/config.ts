import { getAppDataPath, getConfigPath } from "./paths";
import fs, { promises as fsPromises } from 'fs';
import path from 'path';

interface IConfig
{
    /**
     * Directory path with saved books
     */
    booksDir: string
}

const defaultConfig: IConfig = {
    /**
     * Use default books directory `../Documents/epub-reader/Books`
     */
    booksDir: path.resolve(getAppDataPath(), 'Books')
};

let config: IConfig | null = null;

export async function initConfig(): Promise<void>
{
    fs.access(getConfigPath(), fs.constants.F_OK, async (err) => 
    {
        if (err)
        {
            initDefaultConfig();
        }
        else
        {
            const configString: string = await fsPromises.readFile(getConfigPath(), { encoding: 'utf-8' });
            try
            {
                const configLoaded: Record<string, unknown> = JSON.parse(configString);
                config = (configLoaded as unknown) as IConfig;
                console.log(`Loaded config from disk: `, config);
                fixConfig();
                console.log(`Fixed config: `, config);
            }
            catch (error)
            {
                initDefaultConfig();
            }
        }
    });
}


function fixConfig(): void
{
    if (!config || !defaultConfig)
    {
        return;
    }

    const defaultConfigCopy: IConfig = copyConfig();

    const fixedConfig: [Record<string, unknown>, boolean] = fixParams((config as unknown) as Record<string, unknown>, (defaultConfigCopy as unknown) as Record<string, unknown>);
    config = (fixedConfig[0] as unknown) as IConfig;

    /**
     * If at least one param was fixed, save new config to disk 
     */
    const bFixedConfig = fixedConfig[1];
    if (bFixedConfig)
    {
        saveConfig();
    }
}

function fixParams(object: Record<string, unknown>, defaultObject: Record<string, unknown>): [Record<string, unknown>, boolean]
{
    /**
     * Store if at least one param was fixed
     */
    let bFixed = false;
    for (const configParamKey in defaultObject)
    {
        const configParam: unknown = object[configParamKey];
        const defaultParam: unknown = defaultObject[configParamKey];
        const configParamType: varType = getVariableType(configParam);
        const defaultParamType: varType = getVariableType(defaultParam);
        /**
         * If the param in the loaded config is undefined or has wrong type,
         * set it to the default value 
         */
        if (configParam === undefined || (configParamType !== defaultParamType))
        {
            object[configParamKey] = defaultParam;
            bFixed = true;
        }
        else if (configParamType === 'object')
        {
            const fixingObjectResult = fixParams(configParam as Record<string, unknown>, defaultParam as Record<string, unknown>);
            object[configParamKey] = fixingObjectResult[0];
            if (fixingObjectResult[1])
            {
                bFixed = true;
            }
        }
    }


    return [object, bFixed];
}

async function initDefaultConfig(): Promise<void>
{
    config = copyConfig();

    console.log(`Loaded default config `, config);

    await saveConfig();
}

/**
 * Saves config to disk
 */
export async function saveConfig(): Promise<void>
{
    try
    {
        if (!config)
        {
            throw new Error(`Tried to save config to disk. Config was ${config}`);
        }
        fsPromises.writeFile(getConfigPath(), JSON.stringify(config, null, '\t'), { encoding: 'utf-8' });
    }
    catch (error)
    {
        console.error(error);
    }
}

export function copyConfig(): IConfig
{
    const configCopy = copyObject((defaultConfig as unknown) as Record<string, unknown>);

    return (configCopy as unknown) as IConfig;
}

type varType = 'null' | 'undefined' | 'number' | 'string' | 'boolean' | 'object' | 'array';

function getVariableType(variable: unknown): varType
{
    const varTypeof = typeof variable;

    switch (varTypeof)
    {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'string':
            return varTypeof;
        case 'object':
            return Array.isArray(variable) ? 'array' : 'object';
        default:
            return variable === null ? 'null' : 'undefined';
    }
}

function copyObject(objectRef: Record<string, unknown>): Record<string, unknown>
{
    const objectCopy: Record<string, unknown> = {};

    for (const objectKey in objectRef)
    {
        const objectParam: unknown = objectRef[objectKey];
        const objectParamType: varType = getVariableType(objectParam);
        let objectParamToSet = objectParam;
        if (objectParamType === 'object')
        {
            objectParamToSet = copyObject(objectParam as Record<string, unknown>);
        }
        else if (objectParamType === 'array')
        {
            objectParamToSet = [...(objectParam as Array<unknown>)];
        }

        objectCopy[objectKey] = objectParamToSet;
    }

    return objectCopy;
}


export function getConfig(): IConfig
{
    return config as IConfig;
}