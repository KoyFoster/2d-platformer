import React, { useEffect } from 'react';
import './App.css';
import { Canvas, gameInit, renderLoop } from './components';

function App() {
  // On Mount
  useEffect(() => {
    console.log('useEffect');
    // Make sure this runs once
    gameInit();
    renderLoop();

    // return doesn't run in production
    // return () => {
    //   gameInit();
    //   renderLoop();
    // }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <Canvas id='canvas' width={1280} height={720}></Canvas>
      </header>
    </div>
  );
}

export default App;
