<script lang="ts">
  import { Cell, Value } from '$ui';

  interface Props {
    amount: string;
    caption?: string;
    banded?: boolean;
  }

  let { amount, caption, banded = false }: Props = $props();
</script>

<Cell label="Experience" {caption} {banded}>
  <Value kind="xp" value={amount} />
</Cell>
