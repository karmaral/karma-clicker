import './app.css'
import { mount } from 'svelte';
import App from './App.svelte'
import Preview from './preview/Preview.svelte';
import Widgets from './widgets/Widgets.svelte';

const preview = new URLSearchParams(location.search).has('preview');
const widgets = new URLSearchParams(location.search).has('widgets');

const app = mount(widgets ? Widgets : preview ? Preview : App, {
  target: document.getElementById('app'),
});

export default app
