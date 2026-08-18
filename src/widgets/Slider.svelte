<script lang="ts">
  /** One lab row: the drag, and the number as something you can type into. */
  interface Props {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    set: (value: number) => void;
    /** Double-click either half. */
    reset: () => void;
  }

  let { label, value, min, max, step, set, reset }: Props = $props();

  /**
   * What is being typed, while it is being typed. The field shows the value
   * otherwise, so a drag moves it and a half-finished number is not read as one.
   */
  let draft = $state<string | undefined>();

  const shown = $derived(draft ?? String(Number(value.toFixed(3))));

  /** Clamped: the field is here for precision, not for leaving the range. */
  function commit() {
    const typed = Number(draft);

    if (draft !== undefined && draft !== '' && Number.isFinite(typed)) {
      set(Math.max(min, Math.min(max, typed)));
    }

    draft = undefined;
  }

  function key(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key === 'Escape') draft = undefined;
  }
</script>

<div class="row">
  <span class="id">{label}</span>
  <input
    type="range"
    aria-label={label}
    {min}
    {max}
    {step}
    {value}
    oninput={(e) => set(Number(e.currentTarget.value))}
    ondblclick={reset}
  />
  <input
    class="num"
    type="text"
    inputmode="decimal"
    aria-label="{label} value"
    value={shown}
    oninput={(e) => (draft = e.currentTarget.value)}
    onchange={commit}
    onblur={commit}
    onkeydown={key}
    ondblclick={reset}
  />
</div>

<style>
  /* `.row`, `.id` and `.num`'s metrics come from LabPanel, which styles its
     snippets globally; only the field being a field is local. */
  .num {
    border: none;
    border-bottom: 1px solid transparent;
    background: none;
    font: inherit;
    padding: 0;
  }

  .num:hover {
    border-bottom-color: var(--line-300);
  }

  .num:focus {
    outline: none;
    border-bottom-color: var(--ink-900);
    color: var(--ink-900);
  }
</style>
