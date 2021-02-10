import React, { useEffect, useState } from 'react';
import modalStyles from '../../styles/modules/common/modal.module.css';

export function DeletionWarningModal(): JSX.Element
{
    return (<div id={modalStyles['deletion-warning']}>

    </div>);
}


interface IModalWrapperProps
{
    closeModal: () => void;
    children: JSX.Element;
}

export function ModalWrapper(props: IModalWrapperProps): JSX.Element
{
    const [bIsClosing, setIsClosing] = useState(false);

    let closingTimeout: number | null = null;

    useEffect(() =>
    {
        return () =>
        {
            console.log(`ModalWrapper removed`);
            if (closingTimeout && window)
            {
                window.clearTimeout(closingTimeout);
                closingTimeout = null;
            }
        };
    }, []);

    function closeModal(): void
    {
        /**
         * Modal already closing
         */
        if (closingTimeout || !window)
        {
            return;
        }

        setIsClosing(true);

        closingTimeout = window.setTimeout(() => 
        {
            if (typeof props.closeModal === 'function')
            {
                props.closeModal();
            }
        }, 1250);
    }

    return (<div id={modalStyles['wrapper']} className={`${bIsClosing ? modalStyles['wrapper-closing'] : ''}`}>
        <div id={modalStyles['background']} onClick={closeModal} />
        {
            props.children
        }
    </div>);
}

export interface IModalData
{
    element: JSX.Element | null;
    createdAt: number;
}