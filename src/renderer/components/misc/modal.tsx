import React, { useEffect, useState } from 'react';
import { TrashcanSVG } from '../../misc/icons';
import modalStyles from '../../styles/modules/common/modal.module.css';
import { Button } from '../common/button';

interface IDeletionWarningModalProps
{
    text: string;
    onDeleteClick: () => void;
}

export function DeletionWarningModal(props: IDeletionWarningModalProps): JSX.Element
{
    return (<div id={modalStyles['deletion-warning']}>
        <div id={modalStyles['deletion-warning-container']}>
            <TrashcanSVG />
            <div id={modalStyles['deletion-warning-text']}>
                {
                    props.text
                }
            </div>
            <div id={modalStyles['deletion-warning-buttons']}>
                <Button text={`Delete`} class={modalStyles['delete-button']} moduleClass="red" onClick={props.onDeleteClick} />
                <Button text={`Cancel`} class={modalStyles['deletion-cancel-button']}/>
            </div>
        </div>
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