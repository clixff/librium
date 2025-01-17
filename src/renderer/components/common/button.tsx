import React from 'react';
import buttonStyles from '../../styles/modules/common/button.module.css';

interface IButtonProps
{
    text?: string;
    onClick?: () => void;
    tabIndex?: number;
    class?: string | Array<string>;
    moduleClass?: string | Array<string>;
    children?: JSX.Element | string;
    title?: string;
}

function addClassNames(className: string, newClassNames: string | Array<string>, bUseStyleModule: boolean): string
{
    if (typeof newClassNames === 'string')
    {
        let classNameToAdd = '';
        if (bUseStyleModule)
        {
            classNameToAdd = buttonStyles[newClassNames];
        }
        else
        {
            classNameToAdd = newClassNames;
        }
        className += ` ${classNameToAdd}`;
    }
    else
    {
        for (const newClassName of newClassNames)
        {
            let classNameToAdd = '';
            if (bUseStyleModule)
            {
                classNameToAdd = buttonStyles[newClassName];
            }
            else
            {
                classNameToAdd = newClassName;
            }

            className += ` ${classNameToAdd}`;
        }
    }

    return className;
}

export function Button(props: IButtonProps): JSX.Element
{
    let className = `${buttonStyles.button}`;
    if (props.class)
    {
        className = addClassNames(className, props.class, false);
    }
    if (props.moduleClass)
    {
        className = addClassNames(className, props.moduleClass, true);
    }
    
    className = className.trim();
    const customProps: Record<string, unknown> = {
        
    };

    if (props.title)
    {
        customProps.title = props.title;
    }
    return (<button onClick={props.onClick} className={className} tabIndex={props.tabIndex} {...customProps} >
        <div>
            {
                props.text ? props.text : props.children
            }
        </div>
    </button>);
}