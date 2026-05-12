function d20plusSpells () {
	d20plus.spells = {};

	d20plus.spells.formSpellUrl = function (fileName) {
		return d20plus.formSrcUrl(SPELL_DATA_DIR, fileName);
	};

	d20plus.spells._groupOptions = ["Level", "Spell Points", "Alphabetical", "Source"];
	d20plus.spells._listCols = ["name", "class", "level", "school", "source"];
	d20plus.spells._listItemBuilder = (it) => `
		<span class="name col-3" title="name">${it.name}</span>
		<span class="class col-3" title="class">${((it.classes || {}).fromClassList || (it.classes || {}).fromClassListVariant || []).map(c => `CLS[${c.name}]`).join(", ")}</span>
		<span class="level col-1" title="level">LVL[${Parser.spLevelToFull(it.level)}]</span>
		<span class="school col-2" title="school">${Parser.spSchoolAbvToFull(it.school)}</span>
		<span title="source [Full source name is ${Parser.sourceJsonToFull(it.source)}]" class="source col-1">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.spells._listIndexConverter = (sp) => {
		return {
			name: sp.name.toLowerCase(),
			class: ((sp.classes || {}).fromClassList || (sp.classes || {}).fromClassListVariant || []).map(c => c.name.toLowerCase()),
			level: Parser.spLevelToFull(sp.level).toLowerCase(),
			school: Parser.spSchoolAbvToFull(sp.school).toLowerCase(),
			source: Parser.sourceJsonToAbv(sp.source).toLowerCase(),
		};
	};

	// Import Spells button was clicked
	d20plus.spells.button = async function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-spells-url-player").val() : $("#import-spells-url").val();

		if (!url || !url.trim()) return;

		let data;
		if (url === SPELL_DATA_DIR) {
			data = await DataUtil.spell.loadJSON();
		}
		else {
			data = await DataUtil.loadJSON(url);
			await d20plus.importer.pAddBrew(url);
		}

		const handoutBuilder = playerMode ? d20plus.spells.playerImportBuilder : d20plus.spells.handoutBuilder;

		if (data.roll20Spell) spellMetaData.spell = spellMetaData.spell.concat(data.roll20Spell);
		d20plus.importer.showImportList(
			"spell",
			data.spell,
			handoutBuilder,
			{
				groupOptions: d20plus.spells._groupOptions,
				forcePlayer,
				listItemBuilder: d20plus.spells._listItemBuilder,
				listIndex: d20plus.spells._listCols,
				listIndexConverter: d20plus.spells._listIndexConverter,
			},
		);
	};

	// Create spell handout from js data object
	d20plus.spells.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Spells`, folderName);
		const path = ["Spells", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		// build spell handout
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.spSchoolAbvToFull(data.school),
				Parser.spLevelToFull(data.level),
				...(((data.classes || {}).fromClassList || []).map(c => c.name)),
				Parser.sourceJsonToFull(data.source),
			], "spell"),
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [notecontents, gmnotes] = d20plus.spells._getHandoutData(data, options);

				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({notes: (new Date()).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			},
		});
	};

	d20plus.spells.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.spells._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.spells._getHandoutData = function (data, builderOptions) {
		builderOptions = builderOptions || {};
		// merge in roll20 metadata, if available
		const spellMeta = spellMetaData.spell.find(sp => sp.name.toLowerCase() === data.name.toLowerCase() && sp.source.toLowerCase() === data.source.toLowerCase());
		if (spellMeta) {
			data.roll20 = spellMeta.data;
		}

		if (!data.school) data.school = "A";
		if (!data.range) data.range = "Self";
		if (!data.duration) data.duration = "Instantaneous";
		if (!data.components) data.components = "";
		if (!data.time) data.components = "1 action";

		const r20Data = {};
		if (data.roll20) Object.assign(r20Data, data.roll20);
		Object.assign(
			r20Data,
			{
				"Level": builderOptions.isSpellPoints ? String(Math.min(9, d20plus.spells.spLevelToSpellPoints(data.level))) : String(data.level),
				"Range": Parser.spRangeToFull(data.range),
				"School": Parser.spSchoolAbvToFull(data.school),
				"Source": "5etoolsR20",
				"Classes": d20plus.importer.getCleanText(Parser.spClassesToFull(data)),
				"Category": "Spells",
				"Duration": Parser.spDurationToFull(data.duration).replace(/Concentration,\s*/gi, ""), // prevent double concentration text
				"Material": "",
				"Components": d20plus.spells._parseComponents(data.components),
				"Casting Time": Parser.spTimeListToFull(data.time, data.meta),
			},
		);

		if (data.range.type === "point" && (data.range.distance.type === Parser.UNT_FEET || data.range.distance.type === Parser.UNT_MILES)) {
			r20Data["data-RangeNum"] = `${data.range.distance.amount}`;
		}

		let r20json = {
			name: data.name,
			content: "",
			htmlcontent: "",
			data: r20Data,
		};
		if (data.components && data.components.m) {
			if (data.components.m.text) r20json.data["Material"] = data.components.m.text;
			else if (typeof data.components.m === "string") r20json.data["Material"] = data.components.m;
		}
		if (data.meta) {
			if (data.meta.ritual) r20json.data["Ritual"] = "Yes";
		}
		if (data.duration.filter(d => d.concentration).length > 0) {
			r20json.data["Concentration"] = "Yes";
		}
		let notecontents = "";
		let gmnotes = "";
		notecontents += `<p><h3>${data.name}</h3>
<em>${Parser.spLevelSchoolMetaToFull(data.level, data.school, data.meta)}${builderOptions.isSpellPoints && data.level ? ` (${d20plus.spells.spLevelToSpellPoints(data.level)} spell points)` : ""}</em></p><p>
<strong>Casting Time:</strong> ${Parser.spTimeListToFull(data.time, data.meta)}<br>
<strong>Range:</strong> ${Parser.spRangeToFull(data.range)}<br>
<strong>Components:</strong> ${Parser.spComponentsToFull(data.components, data.level)}<br>
<strong>Duration:</strong> ${Parser.spDurationToFull(data.duration)}<br>
</p>`;
		const renderer = new Renderer();
		const renderStack = [];
		const entryList = {type: "entries", entries: data.entries};
		renderer.setBaseUrl(LINK_BASE_URL);
		renderer.recursiveRender(entryList, renderStack, {depth: 1});
		r20json.content = d20plus.importer.getCleanText(renderStack.join(" "));
		r20json.data["data-description"] = r20json.content;
		notecontents += renderStack.join("");
		if (data.entriesHigherLevel) {
			const hLevelRenderStack = [];
			const higherLevelsEntryList = {type: "entries", entries: data.entriesHigherLevel};
			renderer.recursiveRender(higherLevelsEntryList, hLevelRenderStack, {depth: 2});
			const higherLevels = d20plus.importer.getCleanText(hLevelRenderStack.join(" ").replace("At Higher Levels.", ""));
			r20json.content += `\n\n"At Higher Levels: ${higherLevels}`;
			r20json.htmlcontent += `<br><br>"At Higher Levels: ${higherLevels}`;
			notecontents += hLevelRenderStack.join("");
			r20Data["Higher Spell Slot Desc"] = higherLevels;
		}
		notecontents += `<p><strong>Classes:</strong> ${Parser.spClassesToFull(data)}</p>`;
		gmnotes = JSON.stringify(r20json);
		notecontents += `<del class="hidden">${gmnotes}</del>`;

		return [notecontents, gmnotes];
	};

	// parse spell components
	d20plus.spells._parseComponents = function (components) {
		const out = [];
		if (components && components.v) out.push("V");
		if (components && components.s) out.push("S");
		if (components && components.m) out.push("M");
		return out.join(" ");
	};

	d20plus.spells.spLevelToSpellPoints = function (level) {
		switch (level) {
			case 1: return 2;
			case 2: return 3;
			case 3: return 5;
			case 4: return 6;
			case 5: return 7;
			case 6: return 8;
			case 7: return 10;
			case 8: return 11;
			case 9: return 13;
			case 0:
			default: return 0;
		}
	};

	d20plus.spells.importSpells = async function (character, data, event) {
		const attrs = new d20plus.importer.CharacterAttributesProxy(character);

		if (d20plus.sheet === "2024") {
			const spell = data.data;
			const spellId = d20plus.ut.generateRowId();
			const children = [];

			// Function used to add both damage and healing to spell
			function addDamage(id, parent, dice, damageType, type, useMod) {
				var mod = "none";
				if (useMod) mod = "auto";

				const count = dice.substring(0, dice.indexOf('d'));
				const size = dice.substring(dice.indexOf('d'), dice.length)

				attrs.addIntegrant(id, {
					_enabled: true,
					_label: "",
					arrayPosition: attrs.getIntegrantCount(),
					shortID: id.substring(0,9),
					name: data.name + " " + type,
					builderDisplayName: "",
					createdTime: Date.now(),
					type: type,
					source: "",
					childIDs: [],
					parentID: parent,
					parentDisabled: false,
					overwriteDisabled: false,
					ability: mod,
					diceCount: count,
					diceSize: size,
					overrideCrit: false,
					critDiceSize: "",
					damageType: damageType,
				})
			}

			// Try to add healing
			if ("Healing" in spell) {
				const healId = d20plus.ut.generateRowId();
				children.push(healId);
				const addMod = "Add Casting Modifier" in spell && spell["Add Casting Modifier"] == "Yes";
				addDamage(healId, spellId, spell.Healing, "", "Healing", addMod);
			}

			// Add attack/damage if applicable
			if ("Spell Attack" in spell || (("Damage" in spell || "Secondary Damage" in spell) && !("Save" in spell))) {
				children.unshift(d20plus.ut.generateRowId())

				const damages = [];

				// Try to add primary damage
				if ("Damage" in spell) {
					const damageId = d20plus.ut.generateRowId();
					damages.push(damageId);
					const addMod = "Add Casting Modifier" in spell && spell["Add Casting Modifier"] == "Yes";
					addDamage(damageId, children[0], spell.Damage, spell["Damage Type"], "Damage", addMod); 
				}

				// Try to add secondary damage if it was not already used by saving throw
				if ("Secondary Damage" in spell && !("Save" in spell)) {
					const damageId = d20plus.ut.generateRowId();
					damages.push(damageId);
					// Assume modifier does not apply to secondary damage
					addDamage(damageId, children[0], spell["Secondary Damage"], spell["Secondary Damage Type"], "Damage", false); 
				}

				attrs.addIntegrant(children[0], {
					_enabled: true,
					_label: "",
					_reach: false,
					arrayPosition: attrs.getIntegrantCount(),
					name: data.name,
					builderDisplayName: "",
					createdTime: Date.now(),
					type: "Attack",
					childIDs: damages,
					parentID: spellId,
					parentDisabled: false,
					overwriteDisabled: false,
					range: spell.Range,
					actionType: spell["Casting Time"],
					attack: {
						type: "Spell Attack"
					},
					shortID: children[0].substring(0,9),
					source: "",
					autoHit: !("Spell Attack" in spell)
				})
			}

			// Add save if applicable
			if ("Save" in spell) {
				children.unshift(d20plus.ut.generateRowId())

				const damages = [];

				// Try to add primary damage if it is not reserved for a spell attack
				if ("Damage" in spell && !("Spell Attack" in spell)) {
					const damageId = d20plus.ut.generateRowId();
					damages.push(damageId);
					const addMod = "Add Casting Modifier" in spell && spell["Add Casting Modifier"] == "Yes";
					addDamage(damageId, children[0], spell.Damage, spell["Damage Type"], "Damage", addMod); 
				}

				// Try to add secondary damage
				if ("Secondary Damage" in spell) {
					const damageId = d20plus.ut.generateRowId();
					damages.push(damageId);
					// Assume modifier does not apply to secondary damage
					addDamage(damageId, children[0], spell["Secondary Damage"], spell["Secondary Damage Type"], "Damage", false); 
				}

				const saveData = {
					saveAbility: spell.Save
				}

				if ("Save Success" in spell)
					saveData.onSucceed = spell["Save Success"];

				attrs.addIntegrant(children[0], {
					_enabled: true,
					_label: "",
					_reach: false,
					arrayPosition: attrs.getIntegrantCount(),
					name: data.name,
					builderDisplayName: "",
					createdTime: Date.now(),
					type: "Attack",
					childIDs: damages,
					parentID: spellId,
					parentDisabled: false,
					overwriteDisabled: false,
					range: spell.Range,
					actionType: spell["Casting Time"],
					attack: {
						type: "Spell Save"
					},
					save: saveData,
					shortID: children[0].substring(0,9),
					source: "",
				})
			}

			// Add the spell itself
			const spellIntegrant = {
				_enabled: true,
				_label: "",
				_prepared: true,
				alwaysPrepared: false,
				arrayPosition: attrs.getIntegrantCount(),
				castingTime: spell["Casting Time"],
				childIDs: children,
				components: {
					material: spell.Components.includes('M'),
					somatic: spell.Components.includes('S'),
					verbal: spell.Components.includes('V')
				},
				concentration: spell.Concentration,
				createdTime: Date.now(),
				description: spell["data-description"],
				duration: spell.Duration,
				level: parseInt(spell.Level),
				name: data.name,
				overwriteDisabled: false,
				parentDisabled: false,
				range: spell.Range,
				recordName: data.name,
				ritual: "Ritual" in spell && spell.Ritual == "Yes",
				school: spell.School,
				shortID: spellId.substring(0,9),
				source: "",
				type: "Spell",
				upcastText: spell["Higher Spell Slot Desc"]
			};

			// Add cantrip scaling if applicable
			if ("data-Cantrip Scaling" in spell)
				spellIntegrant.cantripScale = spell["data-Cantrip Scaling"].toTitleCase()

			// Add material component if applicable
			if ("Material" in spell)
				spellIntegrant.materialDescription = spell.Material

			// Set spellcasting modifier using spellcasting class if assigned
			try {
				const spellcastingInfo = JSON.parse(attrs.character.model.attribs.at(0).attributes.current.spells.generalSpellSettings.spellcastings.substring(4))
				spellIntegrant.sourceID = attrs.getIntegrant(spellcastingInfo[0].id).parentID;
			} catch {
				// If none assigned, check if any class exists
				const firstId = attrs.getFirstIntegrantIdWith("type", "Class")

				if (firstId != null)
					spellIntegrant.sourceID = firstId;
			}

			attrs.addIntegrant(spellId, spellIntegrant);

			// Add to appropriate spell list
			attrs.character.model.attribs.at(0).attributes.current.spells.displayOrder[spell.Level] = JSON.stringify(
				JSON.parse(attrs.character.model.attribs.at(0).attributes.current.spells.displayOrder[spell.Level]).push(spellId))
		}
		else {
			const importCriticalData = function () {
				// give it time to update the sheet
				setTimeout(() => {
					const rowID = d20plus.importer.findOrGenerateRepeatingRowId(character.model, "repeating_attack_$0_atkname", data.name)

					// crit damage
					if (data.data.Crit && rowID) {
						d20plus.importer.addOrUpdateAttr(character.model, `repeating_attack_${rowID}_dmgcustcrit`, data.data.Crit)
						const critID = d20plus.importer.findAttrId(character.model, `repeating_attack_${rowID}_rollbase_crit`);
						const newCrit = character.model.attribs.get(critID).get("current").replace(/{{crit1=\[\[\d\d?d\d\d?]]}}/g, "{{crit1=[[@{dmgcustcrit}]]}}");
						d20plus.importer.addOrUpdateAttr(character.model, `repeating_attack_${rowID}_rollbase_crit`, newCrit)
					}

					// crit range
					if (data.data["Crit Range"] && rowID) d20plus.importer.addOrUpdateAttr(character.model, `repeating_attack_${rowID}_atkcritrange`, data.data["Crit Range"])
				}, 1000)
			}

			// this is working fine for spells.
			d20plus.importer.doFakeDrop(event, character, data);

			// adding critical info that is missing.
			if (data.data.Crit || data.data["Crit Range"]) importCriticalData()
		}
	};
}

SCRIPT_EXTENSIONS.push(d20plusSpells);
