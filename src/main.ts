import './app.css'
import { mount } from 'svelte';
import App from './App.svelte'
import Preview from './preview/Preview.svelte';
import Widgets from './widgets/Widgets.svelte';
import SimScreen from './features/sim/SimScreen.svelte';

/**
 * The right button belongs to the game. It is a control here — held over a
 * cohort row it opens the derivation, tapped on a buy cell it cycles the mode —
 * and every one of those is a press whose release would otherwise land a menu
 * over whatever it just did. Claimed once, at the document, rather than by each
 * control remembering to refuse it.
 *
 * Editable fields keep theirs: it is the only place the native menu does work
 * the app has no replacement for.
 */
document.addEventListener('contextmenu', (event) => {
  const target = event.target as HTMLElement;
  if (target.closest('input, textarea, [contenteditable="true"]')) return;

  event.preventDefault();
});

const preview = new URLSearchParams(location.search).has('preview');
const widgets = new URLSearchParams(location.search).has('widgets');
const sim = new URLSearchParams(location.search).has('sim');

const app = mount(sim ? SimScreen : widgets ? Widgets : preview ? Preview : App, {
  target: document.getElementById('app'),
});

export default app
