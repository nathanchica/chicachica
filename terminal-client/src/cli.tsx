#!/usr/bin/env node
import { render } from 'ink';

import App from './App.js';

// Clear the terminal on launch
console.clear();

render(<App />);
