import type { BuildingData, ResourceType } from '$types';
import { ResourceManager, PlanetManager } from '$lib/managers';
import Building from './base';
import { biasedPolarity, getPolarityLabel, isPolarized, splitResourceString } from '$lib/utils';

export default class RefinerBuilding extends Building {
  constructor(id: string, initData: BuildingData) {
    super(id, initData);
  }
  override getCosts(n: number) {
    const cost = super.getCosts(n);
    Object.keys(cost).forEach(res => {
      cost[res] = Math.round(cost[res]);
    });
    return cost;
  }

  override _generateResources() {
    const resources = Object.keys(this.production);
    resources.forEach((type: ResourceType) => {
      const unitYield = this.production[type];
      let amount = unitYield * this.owned; // + effects bonuses, eventually

      if (type === 'experience') {
        PlanetManager.getActive().addExperience(amount);
      }

      if (isPolarized(type)) {
        const { polarity_multiplier, polarity_bias } = this.data;
        amount = amount * polarity_multiplier;

        const [base] = splitResourceString(type);
        const polarity = biasedPolarity(polarity_bias);
        const p = getPolarityLabel(polarity);
        const t = `${base}_${p}` as ResourceType;
        const k = `karma_${p}` as ResourceType;

        if (['red', 'yellow', 'blue'].includes(base)) {
          let affordable = amount;
          const conversionCost = ResourceManager.getConversionCost(base, amount);
          if (!ResourceManager.has(k, conversionCost)) {
            affordable = ResourceManager.getAffordableConversionQuantity(type);
          }

          ResourceManager.convert(type, affordable);
          return;
        }

        return ResourceManager.add(t, amount);
      }

      ResourceManager.add(type, amount);
    });
  }
}
