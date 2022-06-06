import React, { useEffect, useRef } from 'react';
import './App.css';
import { Canvas, gameInit, renderLoop } from './components';

function App() {
  // After render
  useEffect(() => {
    console.log('useEffect');
    // Make sure this runs once
    // gameInit();
    // renderLoop();
    // To Prevent multiple calls in dev mode
    // does not work in prod
    return () => {
      gameInit();
      renderLoop();
    }
  });

  return (
    <div className="App">
      <header className="App-header">
        <Canvas id='game-canvas' width={1280} height={720}></Canvas>
      </header>
    </div>
  );
}

export default App;
