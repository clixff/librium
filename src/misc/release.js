const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const exec = require('child_process').exec;

const appVersion = process.env.npm_package_version;
const appName = 'Librium';
const distDirectory = path.join(process.cwd(), 'dist');
const releaseDir = path.join(distDirectory, 'release');


function isDirectoryExists(dirPath)
{
    return new Promise((resolve) =>
    {
        fs.access(dirPath, fs.constants.F_OK, (err) =>
        {
            resolve(!err);
        });
    });
}

function asyncExec(command)
{
    return new Promise((resolve, reject) =>
    {
        exec(command, (err, stdout, stderr) =>
        {
            if (err)
            {
                reject(err);
                return;
            }

            if (stdout)
            {
                console.log(stdout);
            }

            if (stderr)
            {
                console.error(stderr);
                reject(err);
                return;
            }

            resolve();
        });
    });
}

async function findAppExeAndDeleteOtherFiles(dirPath)
{
    let appExe = '';

    const directoryContent = await fsPromises.readdir(dirPath);

    for (let i = 0; i < directoryContent.length; i++)
    {
        const fileName = directoryContent[i];

        if (fileName.startsWith(`${appName} Setup`) && fileName.endsWith('.exe'))
        {
            appExe = fileName;
        }
        else
        {
            if (!(['main', 'release', 'renderer'].includes(fileName)))
            {
                const fullPath = path.join(dirPath, fileName);
                await fsPromises.rm(fullPath, { force: true, recursive: true });
            }
        }
    }


    return appExe;
}

async function moveExeFile(oldPath, archName)
{
    const fullOldPath = path.join(distDirectory, oldPath);
    const fullNewPath = path.join(releaseDir, `${appName}-${appVersion}-${archName}.exe`);
    await fsPromises.rename(fullOldPath, fullNewPath);
}

async function prepareReleaseFiles() 
{
    let bDirectoryExists = await isDirectoryExists(distDirectory);

    if (!bDirectoryExists)
    {
        throw err;
    }

    bDirectoryExists = await isDirectoryExists(releaseDir);

    if (bDirectoryExists)
    {
        await fsPromises.rm(releaseDir, { recursive: true, force: true });
    }

    await fsPromises.mkdir(releaseDir, { recursive: true });

    await asyncExec('npm run dist');

    let appExe = await findAppExeAndDeleteOtherFiles(distDirectory);

    if (appExe)
    {
        await moveExeFile(appExe, 'win64');
    }

    await asyncExec('npm run dist32');

    appExe = await findAppExeAndDeleteOtherFiles(distDirectory);

    if (appExe)
    {
        await moveExeFile(appExe, 'win32');
    }
}

prepareReleaseFiles();