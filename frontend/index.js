:root {
  --bg:#e8edf2;
  --shadow-light: #ffffff;
  --shadow-dark: #c8cdd4;
  --primary: #6c63ff;
  --danger: #e74c3c;
  --warning: #f39c12;
  --success: #27ae60;
  --text: #2d3748;
  --text-muted: #718096;
}

* { box-sizing: border-box; }

body {
  background: var(--bg);
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: var(--text);
  margin: 0;
  padding: 0;
}

.neu-flat {
  background: var(--bg);
  border-radius: 16px;
  box-shadow: 6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light);
}

.neu-pressed {
  background: var(--bg);
  border-radius: 16px;
  box-shadow: inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light);
}

.neu-button {
  background: var(--bg);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: 4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light);
  transition: all 0.15s ease;
  font-weight: 600;
  color: var(--primary);
  font-size: 14px;
}

.neu-button:hover {
  box-shadow: 5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light);
}

.neu-button:active {
  box-shadow: inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light);
  transform: scale(0.98);
}

.neu-input {
  background: var(--bg);
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  width: 100%;
  box-shadow: inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light);
  color: var(--text);
  font-size: 14px;
  outline: none;
}