import Resource from './base.svelte';

export class Experience extends Resource {
  constructor() {
    super('experience');
  }
}

const experience = new Experience();
export default experience;
