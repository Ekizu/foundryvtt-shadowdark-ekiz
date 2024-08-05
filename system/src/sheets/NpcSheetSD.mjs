import ActorSheetSD from "./ActorSheetSD.mjs";

export default class NpcSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "npc"],
			scrollY: ["section.SD-content-body"],
			width: 600,
			height: 730,
			resizable: true,
			tabs: [
				{
					navSelector: ".SD-nav",
					contentSelector: ".SD-content-body",
					initial: "tab-details",
				},
			],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/npc.hbs";
	}

	async _onRollItem(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		if (item.type === "NPC Attack" && item.system.attackType === "special") {
			// TODO These are not technically rollable, but maybe in the
			// future we could add an interactive chat card for contested
			// checks, etc.
			return;
		}

		const data = {
			item: item,
			actor: this.actor,
		};

		// Summarize the bonuses for the attack roll
		const parts = ["1d20", "@attackBonus"];
		data.attackBonus = item.system.bonuses.attackBonus;

		data.damageParts = ["@damageBonus"];
		data.damageBonus = item.system.bonuses.damageBonus;

		return item.rollNpcAttack(parts, data);
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find("[data-action='item-use-ability']").click(
			event => this._onUseAbility(event)
		);

		html.find("[data-action='cast-npc-spell']").click(
			event => this._onCastSpell(event)
		);

		html.find(".toggle-lost").click(
			event => this._onToggleLost(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		// Ability Scores
		for (const [key, ability] of Object.entries(context.system.abilities)) {
			const labelKey = `SHADOWDARK.ability_${key}`;
			ability.label = `${game.i18n.localize(labelKey)}`;
		}

		await this._prepareItems(context);

		return context;
	}

	_roundToOneDecimal(number) {
		return Math.round(number * 10) / 10;
	}

	async _prepareItems(context) {
		const attacks = [];
		const specials = [];
		const spells = [];
		const features = [];
		const gems = [];

		const effects = {
			effect: {
				label: game.i18n.localize("SHADOWDARK.item.effect.category.effect"),
				items: [],
			},
			condition: {
				label: game.i18n.localize("SHADOWDARK.item.effect.category.condition"),
				items: [],
			},
		};

		const inventory = {
			treasure: [],
			carried: [],
		};

		const slots = {
			total: 0,
			gear: 0,
			treasure: 0,
			coins: 0,
			gems: 0,
		};

		const freeCarrySeen = {};

		for (const i of this._sortAllItems(context)) {
			if (i.system.isPhysical && i.type !== "Gem") {
				i.showQuantity = i.system.slots.per_slot > 1 ? true : false;

				// We calculate how many slots are used by this item, taking
				// into account the quantity and any free items.
				//
				let freeCarry = i.system.slots.free_carry;

				if (Object.hasOwn(freeCarrySeen, i.name)) {
					freeCarry = Math.max(0, freeCarry - freeCarrySeen[i.name]);
					freeCarrySeen[i.name] += freeCarry;
				}
				else {
					freeCarrySeen[i.name] = freeCarry;
				}

				const perSlot = i.system.slots.per_slot; // combien d'items dans une stack (1 slot)
				const quantity = i.system.quantity; // combien d'items
				const slotsUsed = i.system.slots.slots_used; // slots utilisé pour Max Qty

				//let totalSlotsUsed = Math.ceil(quantity / perSlot) * slotsUsed;
				let totalSlotsUsed = this._roundToOneDecimal((quantity / perSlot) * slotsUsed);
				totalSlotsUsed -= freeCarry * slotsUsed;

				i.slotsUsed = totalSlotsUsed >= 0 ? totalSlotsUsed : 0;

				// calculate slot usage
				if (i.system.treasure) {
					slots.treasure += i.slotsUsed;
				}
				else {
					slots.gear += i.slotsUsed;
				}

				// sort into groups
				if (i.system.treasure) {
					inventory.treasure.push(i);
				}
				else {
					inventory.carried.push(i);
				}
			}
			// Push Attacks
			else if (i.type === "NPC Attack") {
				const display = await this.actor.buildNpcAttackDisplays(i._id);
				attacks.push({itemId: i._id, display});
			}
			// Push Specials
			else if (i.type === "NPC Special Attack") {
				const display = await this.actor.buildNpcSpecialDisplays(i._id);
				specials.push({itemId: i._id, display});
			}
			// Push Features
			else if (i.type === "NPC Feature") {
				const description = await TextEditor.enrichHTML(
					jQuery(i.system.description).text(),
					{
						async: true,
					}
				);

				features.push({
					itemId: i._id,
					name: i.name,
					description,
				});
			}
			// Push Spells
			else if (i.type === "NPC Spell") {
				i.description = await TextEditor.enrichHTML(
					jQuery(i.system.description).text(),
					{
						async: true,
					}
				);
				spells.push(i);
			}
			// Push Effects
			else if (i.type === "Effect") {
				const category = i.system.category;
				effects[category].items.push(i);
			}
		}

		// Work out how many slots all these coins are taking up...
		const coins = this.actor.system.coins;
		const totalCoins = coins.gp + coins.sp + coins.cp;

		const freeCoins = shadowdark.defaults.FREE_COIN_CARRY;
		if (totalCoins > freeCoins) {
			slots.coins = Math.ceil((totalCoins - freeCoins) / freeCoins);
		}

		// Now do the same for gems...
		let totalGems = gems.length;
		if (totalGems > 0) {
			slots.gems = Math.ceil(totalGems / CONFIG.SHADOWDARK.DEFAULTS.GEMS_PER_SLOT);
		}

		// calculate total slots
		slots.total = slots.gear + slots.treasure + slots.coins + slots.gems;

		context.totalCoins = totalCoins;
		context.gems = {items: gems, totalGems};
		context.inventory = inventory;
		context.slots = slots;

		context.attacks = attacks;
		context.specials = specials;
		context.spells = spells;
		context.features = features;
		context.effects = effects;
	}

	async _onUseAbility(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget).data("item-id");
		this.actor.useAbility(itemId);
	}

	async _onCastSpell(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");

		if (event.shiftKey) {
			this.actor.castNPCSpell(itemId, {fastForward: true});
		}
		else {
			this.actor.castNPCSpell(itemId);
		}
	}

	async _onDropItem(event, data) {
		// get uuid of dropped item
		const droppedItem = await fromUuid(data.uuid);

		// if it's an PC spell, convert to NPC spell, else return as normal
		if (droppedItem.type === "Spell") {
			const newNpcSpell = {
				name: droppedItem.name,
				type: "NPC Spell",
				system: {
					description: droppedItem.system.description,
					duration: {
						type: droppedItem.system.duration.type,
						value: droppedItem.system.duration.value,
					},
					range: droppedItem.system.range,
					dc: droppedItem.system.tier + 10,
				},
			};
			// add new spell to NPC
			this.actor.createEmbeddedDocuments("Item", [newNpcSpell]);
		}
		else {
			super._onDropItem(event, data);
		}
	}
}
