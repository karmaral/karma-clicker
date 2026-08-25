import Resource from './base.svelte';

export class Wisdom extends Resource {
  constructor() {
    super('wisdom');
  }
}

const wisdom = new Wisdom();
export default wisdom;
