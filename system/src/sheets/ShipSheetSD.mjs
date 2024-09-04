import ActorSheetSD from "./ActorSheetSD.mjs";

export default class ShipSheetSD extends ActorSheetSD {

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
		return "systems/shadowdark/templates/actors/ship.hbs";
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

		html.find("[data-action='create-item']").click(
			event => this._onCreateItem(event)
		);

		html.find("[data-action='create-treasure']").click(
			event => this._onCreateTreasure(event)
		);

		html.find("[data-action='item-decrement']").click(
			event => this._onItemQuantityDecrement(event)
		);

		html.find("[data-action='item-increment']").click(
			event => this._onItemQuantityIncrement(event)
		);

		html.find("[data-action='item-use-ability']").click(
			event => this._onUseAbility(event)
		);

		html.find("[data-action='roll-hull']").click(
			event => this._onRollHull(event)
		);

		html.find("[data-action='roll-crew']").click(
			event => this._onRollCrew(event)
		);

		html.find("[data-action='roll-agility']").click(
			event => this._onRollAgility(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);
		context.gearSlots = context.system.slots;

		// Ability Scores
		for (const [key, ability] of Object.entries(context.system.abilities)) {
			const labelKey = `SHADOWDARK.ability_${key}`;
			ability.label = `${game.i18n.localize(labelKey)}`;
		}

		await this._prepareItems(context);

		return context;
	}

	async _onCreateItem(event) {
		new Dialog( {
			title: game.i18n.localize("SHADOWDARK.dialog.create_custom_item"),
			content: await renderTemplate("systems/shadowdark/templates/dialog/create-new-item.hbs"),
			buttons: {
				create: {
					label: game.i18n.localize("SHADOWDARK.dialog.create"),
					callback: async html => {
						// create item from dialog data
						const itemData = {
							name: html.find("#item-name").val(),
							type: html.find("#item-type").val(),
							system: {},
						};
						const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
						newItem.sheet.render(true);
					},
				},
			},
			default: "create",
		}).render(true);
	}

	async _onCreateTreasure(event) {
		new Dialog( {
			title: game.i18n.localize("SHADOWDARK.dialog.create_treasure"),
			content: await renderTemplate("systems/shadowdark/templates/dialog/create-new-treasure.hbs"),
			buttons: {
				create: {
					label: game.i18n.localize("SHADOWDARK.dialog.create"),
					callback: async html => {
						// create treasure from dialog data
						const itemData = {
							name: html.find("#item-name").val(),
							type: "Basic",
							system: {
								treasure: true,
								cost: {
									gp: parseInt(html.find("#item-gp").val()),
									sp: parseInt(html.find("#item-sp").val()),
									cp: parseInt(html.find("#item-cp").val()),
								},
							},
						};
						await this.actor.createEmbeddedDocuments("Item", [itemData]);
					},
				},
			},
			default: "create",
		}).render(true);
	}

	async _onItemQuantityDecrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity > 0) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.quantity": item.system.quantity - 1,
				},
			]);
		}
	}

	async _onItemQuantityIncrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity < item.system.slots.per_slot) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.quantity": item.system.quantity + 1,
				},
			]);
		}
	}

	_roundToOneDecimal(number) {
		return Math.round(number * 10) / 10;
	}

	async _prepareItems(context) {
		const attacks = [];
		const specials = [];
		const spells = [];
		const features = [];

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
		};

		const freeCarrySeen = {};

		for (const i of this._sortAllItems(context)) {
			if (i.system.isPhysical) {
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
				if (i.system.treasure || i.type === "Gem") {
					slots.treasure += i.slotsUsed;
				}
				else {
					slots.gear += i.slotsUsed;
				}

				// sort into groups
				if (i.system.treasure || i.type === "Gem") {
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

		// calculate total slots
		slots.total = slots.gear + slots.treasure + slots.coins;

		context.totalCoins = totalCoins;
		context.inventory = inventory;
		context.slots = slots;

		context.attacks = attacks;
		context.specials = specials;
		context.spells = spells;
		context.features = features;
		context.effects = effects;
	}

	async _onRollHull(event) {
		event.preventDefault();

		const hull = this.actor.system.attributes.ac.value;

		const data = {
			rollType: "hull",
			actor: this.actor,
		};

		const parts = [`1d${hull}`];

		let options={};
		options.fastForward = true;
		options.chatMessage = true;

		options.title = game.i18n.localize("SHADOWDARK.dialog.hull_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";
		options.rollMode = CONST.DICE_ROLL_MODES.PUBLIC;

		const result = await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	async _onRollCrew(event) {
		event.preventDefault();

		const crewSkill = this.actor.system.skill;

		const data = {
			rollType: "crew",
			actor: this.actor,
		};

		const parts = [`1d20+${crewSkill}`];

		let options={};
		options.fastForward = true;
		options.chatMessage = true;

		options.title = game.i18n.localize("SHADOWDARK.dialog.crew_skill_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";
		options.rollMode = CONST.DICE_ROLL_MODES.PUBLIC;

		const result = await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	async _onRollAgility(event) {
		event.preventDefault();

		const shipAgility = this.actor.system.shipAgility;

		const data = {
			rollType: "agility",
			actor: this.actor,
		};

		const parts = [`1d20+${shipAgility}`];

		let options={};
		options.fastForward = true;
		options.chatMessage = true;

		options.title = game.i18n.localize("SHADOWDARK.dialog.ship_agility_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";
		options.rollMode = CONST.DICE_ROLL_MODES.PUBLIC;

		const result = await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	async _onUseAbility(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget).data("item-id");
		this.actor.useAbility(itemId);
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
