import React, { useEffect } from 'react';
import './App.css';
import { Canvas, gameInit, renderLoop } from './components';

function App() {
  // On Mount
  useEffect(() => {
    // Make sure this runs once
    return () => {
      gameInit();
      renderLoop();
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <Canvas id='canvas' width={1280} height={720}></Canvas>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
