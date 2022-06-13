/* eslint-disable prettier/prettier */
import React from 'react';
import ReactDOM from 'react-dom/client';
// eslint-disable-next-line unused-imports/no-unused-imports
import App from './App';
// import reportWebVitals from './reportWebVitals';
import styles from './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
console.log('styles:', styles);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode >
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
