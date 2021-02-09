export function bindFunctionsContext(context: unknown, methodsList: Array<string>): void
{
    if (!context || typeof context !== 'object' || context === null || Array.isArray(context) || !Array.isArray(methodsList))
    {
        return;
    }

    for (let i = 0; i < methodsList.length; i++)
    {
        const methodName: string = methodsList[i];
        const method: (...args) => unknown | undefined | unknown = context[methodName];
        if (typeof method === 'function')
        {
            context[methodName] = method.bind(context);
        }
        else
        {
            console.error();
        }
    }

}