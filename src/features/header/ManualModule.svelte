<script lang="ts">
  import { Button, Cell } from '$ui';

  interface Props {
    action?: string;
    sub?: string;
    progress?: number;
    disabled?: boolean;
    onincarnate?: () => void;
    banded?: boolean;
  }

  let {
    action = 'Incarnate',
    sub,
    progress,
    disabled = false,
    onincarnate,
    banded = false,
  }: Props = $props();
</script>

<Cell label="Manual" {banded}>
  <Button label={action} {sub} {progress} {disabled} onclick={onincarnate} />
</Cell>
