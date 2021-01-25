import React from 'react';
import buttonStyles from '../../styles/modules/common/button.module.css';

interface IButtonProps
{
    text: string;
    onClick?: () => void;
    tabIndex?: number;
}

export function Button(props: IButtonProps): JSX.Element
{
    return (<button onClick={props.onClick} className={`${buttonStyles.button}`} tabIndex={props.tabIndex}>
        <div>
            {
                props.text
            }
        </div>
    </button>);
}