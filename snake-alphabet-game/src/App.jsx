import { useState } from 'react';
import Gameboard from './components/Gameboard';
import './App.css';

function App() {
  const [imagePath, setImagePath] = useState('/images/cat.jpg'); // default image

  return (
    <div className="App">
      <h1 className="title">Alphabet Snake 🐍</h1>

      {/* Word Image below title */}
      <div className="word-image">
        <img src={imagePath} alt="Word" />
      </div>

      {/* Gameboard provides image change callback */}
      <Gameboard onImageChange={setImagePath} />
    </div>
  );
}

export default App;
