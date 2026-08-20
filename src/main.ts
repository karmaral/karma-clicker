import './app.css'
import { mount } from 'svelte';
import App from './App.svelte'
import Preview from './preview/Preview.svelte';
import Widgets from './widgets/Widgets.svelte';
import SimScreen from './features/sim/SimScreen.svelte';

const preview = new URLSearchParams(location.search).has('preview');
const widgets = new URLSearchParams(location.search).has('widgets');
const sim = new URLSearchParams(location.search).has('sim');

const app = mount(sim ? SimScreen : widgets ? Widgets : preview ? Preview : App, {
  target: document.getElementById('app'),
});

export default app
