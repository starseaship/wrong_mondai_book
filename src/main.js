import './styles.css';
import { startApp } from './app.js';

const root = document.getElementById('app');

if (!root) {
  throw new Error('Missing #app root element.');
}

startApp(root);
