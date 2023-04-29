<script lang="ts">
  import { experience, karma } from '$lib/resources';
  import { formatNumber } from '$lib/utils';

</script>

<div class="resources">
  <div class="resource experience">
    <span class="title">Experience</span>
    <p>
      {formatNumber($experience.amount)}
    </p>
    <p style:font-size=".5em">{formatNumber($experience.total)} total</p>
  </div>
  <div class="resource karma">
    <span class="title">Karma</span>
    <p>
      {formatNumber($karma.amount)}
    </p>
    <p style:font-size=".5em">{formatNumber($karma.total)} total</p>
  </div>
</div>


<style>
  .resources {
    display: grid;
    gap: .5em;
    grid-template-columns: 1fr 1fr;
  }
  .resource {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: .3em;
    font-size: 1.5em;
  }
  .resource .title {
    font-size: .6em;
    font-weight: 500;
    line-height: 1;
  }
  .resource :global(svg) {
    width: 1.5em;
    height: 1.5em;
    transform: translateY(.1em);
    opacity: .3;
  }
  p {
    margin: 0;
  }
  span {
    font-size: .5em;
  }

</style>
