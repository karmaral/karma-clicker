import './app.css'
import { mount } from 'svelte';
import App from './App.svelte'
import Preview from './preview/Preview.svelte';

const preview = new URLSearchParams(location.search).has('preview');

const app = mount(preview ? Preview : App, {
  target: document.getElementById('app'),
});

export default app
