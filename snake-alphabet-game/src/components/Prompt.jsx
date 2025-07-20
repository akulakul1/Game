import './Prompt.css';

export default function Prompt({ image, word, progress }) {
  return (
    <div className="prompt">
      
      <div className="prompt-word">
        {word.split('').map((char, idx) => (
          <span key={idx} className={idx < progress ? 'done' : ''}>{char}</span>
        ))}
      </div>
    </div>
  );
}