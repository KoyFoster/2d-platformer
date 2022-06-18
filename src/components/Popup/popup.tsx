import React from 'react';
import css from './index.css';

interface DialogueProps {
    children?: HTMLCollection;
}

export const Popup = ({ children }: DialogueProps) => {
    console.log({ children });
    return <div className={css.dialogue}>{!!children || children}</div>;
};
