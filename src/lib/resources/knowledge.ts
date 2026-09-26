import Resource from './base.svelte';

export class Knowledge extends Resource {
  constructor() {
    super('knowledge');
  }
}

const knowledge = new Knowledge();
export default knowledge;
