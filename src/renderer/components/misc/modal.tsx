import React, { useEffect, useState } from 'react';
import { TrashcanSVG } from '../../misc/icons';
import modalStyles from '../../styles/modules/common/modal.module.css';
import { Button } from '../common/button';

interface IDeletionWarningModalProps
{
    text: string;
    onDeleteClick: () => void;
    closeModal: () => void;
}

export function DeletionWarningModal(props: IDeletionWarningModalProps): JSX.Element
{
    function handleDeleteClick(): void
    {
        if (typeof props.onDeleteClick === 'function')
        {
            props.onDeleteClick();
        }

        if (typeof props.closeModal === 'function')
        {
            props.closeModal();
        }
    }

    function handleCancelClick(): void
    {
        if (typeof props.closeModal === 'function')
        {
            props.closeModal();
        }
    }

    return (<div id={modalStyles['deletion-warning']}>
        <div id={modalStyles['deletion-warning-container']}>
            <TrashcanSVG />
            <div id={modalStyles['deletion-warning-text']}>
                {
                    props.text
                }
            </div>
            <div id={modalStyles['deletion-warning-buttons']}>
                <Button text={`Delete`} class={modalStyles['delete-button']} moduleClass="red" onClick={handleDeleteClick} />
                <Button text={`Cancel`} class={modalStyles['deletion-cancel-button']} onClick={handleCancelClick}/>
            </div>
        </div>
    </div>);
}


interface IModalWrapperProps
{
    closeModal: () => void;
    isClosing: boolean;
    children: JSX.Element;
}

export function ModalWrapper(props: IModalWrapperProps): JSX.Element
{
    function closeModal(): void
    {
        if (props.isClosing)
        {
            return;
        }

        if (typeof props.closeModal === 'function')
        {
            props.closeModal();
        }
    }

    function handleKeyUp(event: KeyboardEvent): void
    {
        if (event.key === 'Escape')
        {
            closeModal();
        }
    }

    useEffect(() =>
    {
        window.addEventListener('keyup', handleKeyUp);

        return (() => 
        {
            window.removeEventListener('keyup', handleKeyUp);
        });
    }, []);

    return (<div id={modalStyles['wrapper']} className={`${props.isClosing ? modalStyles['wrapper-closing'] : ''}`}>
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
    isClosing: boolean;
}