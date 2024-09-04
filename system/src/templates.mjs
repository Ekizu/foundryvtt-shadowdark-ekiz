export default function() {
	const partials = [
		"systems/shadowdark/templates/actors/npc/abilities.hbs",
		"systems/shadowdark/templates/actors/npc/abilities/attacks.hbs",
		"systems/shadowdark/templates/actors/npc/abilities/features.hbs",
		"systems/shadowdark/templates/actors/npc/abilities/specials.hbs",
		"systems/shadowdark/templates/actors/npc/description.hbs",
		"systems/shadowdark/templates/actors/npc/partials/ability-scores.hbs",
		"systems/shadowdark/templates/actors/npc/partials/ac.hbs",
		"systems/shadowdark/templates/actors/npc/partials/morale.hbs",
		"systems/shadowdark/templates/actors/npc/partials/hp.hbs",
		"systems/shadowdark/templates/actors/npc/partials/level.hbs",
		"systems/shadowdark/templates/actors/npc/spells.hbs",
		"systems/shadowdark/templates/actors/npc/inventory.hbs",
		"systems/shadowdark/templates/actors/npc/inventory/coins.hbs",
		"systems/shadowdark/templates/actors/npc/inventory/slots.hbs",
		"systems/shadowdark/templates/actors/ship/abilities.hbs",
		"systems/shadowdark/templates/actors/ship/abilities/attacks.hbs",
		"systems/shadowdark/templates/actors/ship/abilities/features.hbs",
		"systems/shadowdark/templates/actors/ship/abilities/specials.hbs",
		"systems/shadowdark/templates/actors/ship/description.hbs",
		"systems/shadowdark/templates/actors/ship/partials/morale.hbs",
		"systems/shadowdark/templates/actors/ship/partials/agility.hbs",
		"systems/shadowdark/templates/actors/ship/partials/speed.hbs",
		"systems/shadowdark/templates/actors/ship/partials/hull.hbs",
		"systems/shadowdark/templates/actors/ship/partials/skill.hbs",
		"systems/shadowdark/templates/actors/ship/partials/hp.hbs",
		"systems/shadowdark/templates/actors/ship/inventory.hbs",
		"systems/shadowdark/templates/actors/ship/inventory/coins.hbs",
		"systems/shadowdark/templates/actors/ship/inventory/slots.hbs",
		"systems/shadowdark/templates/actors/partials/effects.hbs",
		"systems/shadowdark/templates/actors/player/abilities.hbs",
		"systems/shadowdark/templates/actors/player/abilities/ac.hbs",
		"systems/shadowdark/templates/actors/player/abilities/attacks.hbs",
		"systems/shadowdark/templates/actors/player/abilities/class.hbs",
		"systems/shadowdark/templates/actors/player/abilities/hp.hbs",
		"systems/shadowdark/templates/actors/player/abilities/luck.hbs",
		"systems/shadowdark/templates/actors/player/abilities/stats.hbs",
		"systems/shadowdark/templates/actors/player/details.hbs",
		"systems/shadowdark/templates/actors/player/details/boons.hbs",
		"systems/shadowdark/templates/actors/player/details/skills.hbs",
		"systems/shadowdark/templates/actors/player/inventory.hbs",
		"systems/shadowdark/templates/actors/player/inventory/coins.hbs",
		"systems/shadowdark/templates/actors/player/inventory/gems.hbs",
		"systems/shadowdark/templates/actors/player/inventory/slots.hbs",
		"systems/shadowdark/templates/actors/player/notes.hbs",
		"systems/shadowdark/templates/actors/player/spells.hbs",
		"systems/shadowdark/templates/actors/player/talents.hbs",
		"systems/shadowdark/templates/items/partials/active-effects.hbs",
		"systems/shadowdark/templates/items/partials/ancestry.hbs",
		"systems/shadowdark/templates/items/partials/armor.hbs",
		"systems/shadowdark/templates/items/partials/boon.hbs",
		"systems/shadowdark/templates/items/partials/skill.hbs",
		"systems/shadowdark/templates/items/partials/choice-selector.hbs",
		"systems/shadowdark/templates/items/partials/class-ability.hbs",
		"systems/shadowdark/templates/items/partials/class.hbs",
		"systems/shadowdark/templates/items/partials/cost.hbs",
		"systems/shadowdark/templates/items/partials/deity.hbs",
		"systems/shadowdark/templates/items/partials/duration.hbs",
		"systems/shadowdark/templates/items/partials/effect.hbs",
		"systems/shadowdark/templates/items/partials/item-category.hbs",
		"systems/shadowdark/templates/items/partials/language.hbs",
		"systems/shadowdark/templates/items/partials/light-source.hbs",
		"systems/shadowdark/templates/items/partials/npc-attack.hbs",
		"systems/shadowdark/templates/items/partials/npc-special-attack.hbs",
		"systems/shadowdark/templates/items/partials/npc-spell.hbs",
		"systems/shadowdark/templates/items/partials/properties.hbs",
		"systems/shadowdark/templates/items/partials/property.hbs",
		"systems/shadowdark/templates/items/partials/slots.hbs",
		"systems/shadowdark/templates/items/partials/spell.hbs",
		"systems/shadowdark/templates/items/partials/talent.hbs",
		"systems/shadowdark/templates/items/partials/weapon.hbs",
		"systems/shadowdark/templates/items/partials/wound.hbs",
		"systems/shadowdark/templates/items/partials/ammunition.hbs",
		"systems/shadowdark/templates/items/tabs/description.hbs",
		"systems/shadowdark/templates/items/tabs/details.hbs",
		"systems/shadowdark/templates/items/tabs/effects.hbs",
		"systems/shadowdark/templates/items/tabs/light.hbs",
		"systems/shadowdark/templates/items/tabs/source.hbs",
		"systems/shadowdark/templates/items/tabs/spellsknown.hbs",
		"systems/shadowdark/templates/items/tabs/titles.hbs",
		"systems/shadowdark/templates/partials/details/armor.hbs",
		"systems/shadowdark/templates/partials/details/default.hbs",
		"systems/shadowdark/templates/partials/details/npc-spell.hbs",
		"systems/shadowdark/templates/partials/details/spell.hbs",
		"systems/shadowdark/templates/partials/details/weapon.hbs",
		"systems/shadowdark/templates/partials/weapon-attack.hbs",
		"systems/shadowdark/templates/ui/sd-box.hbs",
	];

	const paths = {};
	for (const path of partials) {
		const [key] = path.split("/").slice(3).join("/").split(".");
		paths[key] = path;
	}

	return loadTemplates(paths);
}
