function d20plusRaces () {
	d20plus.races = {};

	// Import Races button was clicked
	d20plus.races.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-races-url-player").val() : $("#import-races-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.races.playerImportBuilder : d20plus.races.handoutBuilder;

			DataUtil.loadJSON(url).then(async (data) => {
				const toImport = MiscUtil.copy(data.race);
				if (data.subrace) {
					const allraces = await DataUtil.loadJSON(RACE_DATA_URL);
					// this does not handle homebrew parent races in "subrace" block
					// i found none in the existing homebrew at the time of doing this, so propably won't be such an issue
					toImport.push(...d20plus.races.adoptSubraces(allraces.race, data.subrace, false))
				}
				await d20plus.importer.pAddBrew(url);
				d20plus.importer.showImportList(
					"race",
					Renderer.race.mergeSubraces(toImport),
					handoutBuilder,
					{
						forcePlayer,
					},
				);
			});
		}
	};

	d20plus.races.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Races`, folderName);
		const path = ["Races", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				(data.size || [Parser.SZ_VARIES]).map(sz => Renderer.utils.getRenderedSize(sz)).join("/"),
				Parser.sourceJsonToFull(data.source),
			], "race"),
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.races._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date()).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			},
		});
	};

	d20plus.races.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.races._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.races._getHandoutData = function (data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];
		const ability = Renderer.getAbilityData(data.ability);
		renderStack.push(`
		<h3>${data.name}</h3>
		<p>
			<strong>Ability Scores:</strong> ${ability.asText}<br>
			<strong>Size:</strong> ${(data.size || [Parser.SZ_VARIES]).map(sz => Renderer.utils.getRenderedSize(sz)).join("/")}<br>
			<strong>Speed:</strong> ${Parser.getSpeedString(data)}<br>
		</p>
	`);
		renderer.recursiveRender({entries: data.entries}, renderStack, {depth: 1});
		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Races",
			},
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	// copied from ../lib/render.js for small changes
	d20plus.races.adoptSubraces = function (allRaces, subraces, keepOriginalSubraces = true) {
		const nxtData = [];

		subraces.forEach(sr => {
			if (!sr.raceName || !sr.raceSource) throw new Error(`Subrace was missing parent "raceName" and/or "raceSource"!`);

			const _baseRace = allRaces.find(r => r.name === sr.raceName && r.source === sr.raceSource);
			if (!_baseRace) {
				// eslint-disable-next-line no-console
				console.warn(`${sr.raceName} parent race not found! Contact homebrew maintainer as it is probably a wrong entry`);
				return;
			}

			// Attempt to graft multiple subraces from the same data set onto the same base race copy
			let baseRace = nxtData.find(r => r.name === sr.raceName && r.source === sr.raceSource);
			if (!baseRace) {
				// copy and remove base-race-specific data
				baseRace = MiscUtil.copy(_baseRace);
				if (baseRace._rawName) {
					baseRace.name = baseRace._rawName;
					delete baseRace._rawName;
				}
				delete baseRace._isBaseRace;
				delete baseRace._baseRaceEntries;

				baseRace.subraces = baseRace.subraces && keepOriginalSubraces ? baseRace.subraces : [];
				nxtData.push(baseRace);
			}

			baseRace.subraces.push(sr);
		});

		return nxtData;
	};

	d20plus.races.importRace = function (character, data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const race = data.Vetoolscontent;

		race.entries.filter(it => typeof it !== "string").forEach(e => {
			const renderStack = [];
			renderer.recursiveRender({entries: e.entries}, renderStack);
			e.text = d20plus.importer.getCleanText(renderStack.join(""));
		});

		const attrs = new d20plus.importer.CharacterAttributesProxy(character);

		if (d20plus.sheet === "ogl") {
			attrs.addOrUpdate(`race`, race.name);
			attrs.addOrUpdate(`race_display`, race.name);
			attrs.addOrUpdate(`speed`, Parser.getSpeedString(race));

			race.entries.filter(it => it.text).forEach(e => {
				const fRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_traits_${fRowId}_name`, e.name);
				attrs.add(`repeating_traits_${fRowId}_source`, "Race");
				attrs.add(`repeating_traits_${fRowId}_source_type`, race.name);
				attrs.add(`repeating_traits_${fRowId}_description`, e.text);
				attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				if (race._baseName === "Halfling" && e.name === "Lucky") attrs.addOrUpdate(`halflingluck_flag`, "1");
			});

			if (race.languageProficiencies && race.languageProficiencies.length) {
				// FIXME this discards information
				const profs = race.languageProficiencies[0];
				const asText = Object.keys(profs).filter(it => it !== "choose").map(it => it === "anyStandard" ? "any" : it).map(it => it.toTitleCase()).join(", ");

				const lRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_proficiencies_${lRowId}_name`, asText);
				attrs.add(`repeating_proficiencies_${lRowId}_options-flag`, "0");
			}
		} else if (d20plus.sheet === "2024") {
			// References for reuse
			const current = attrs.character.model.attribs.at(1).attributes.current;
			const raceSize = (race.size || [Parser.SZ_VARIES]).map(sz => Parser.sizeAbvToFull(sz)).join("/").toUpperCase();

			// CREATE CUSTOM SPECIES
			const sourceId = d20plus.ut.generateRowId();
			const childIds = [];

			// TODO: Apply size (Currently gets reverted when changed here for some reason)
			/*if (!current["about"])
				current["about"] = {};
			if (!current.about["characteristics"])
				current.about["characteristics"] = {};
			current.about.characteristics["size"] = raceSize
			console.log(current.about.characteristics.size);*/

			// Add all features (vision descriptions should be added here, so no need to add that)
			race.entries.filter(it => it.text).forEach(e => {
				childIds.push(d20plus.ut.generateRowId());
				attrs.addIntegrant(childIds[childIds.length-1], {
					shortID: childIds[childIds.length-1].substring(0,9),
					name: e.name,
					builderDisplayName: "",
					_label: "",
					createdTime: Date.now(),
					type: "Features",
					_enabled: true,
					source: "Species",
					sourceID: sourceId,
					childIDs: "[]",
					parentID: sourceId,
					parentDisabled: false,
					overwriteDisabled: false,
					description: e.text,
					arrayPosition: attrs.getIntegrantCount()
				});
			});

			// Apply senses
			for (const vision of ["darkvision", "blindsight", "tremorsense", "truesight"]) {
				if (race[vision]) {
					const visionId = d20plus.ut.generateRowId();
					const titleCaseSense = vision.charAt(0).toUpperCase() + vision.slice(1);

					// Add the integrant that actually causes the sense to appear
					attrs.addIntegrant(visionId, {
						_enabled: true,
						_label: "",
						arrayPosition: attrs.getIntegrantCount(),
						builderDisplayName: "",
						calculation: "Set Base",
						childIDs: "[]",
						createdTime: Date.now(),
						name: titleCaseSense,
						overwriteDisabled: false,
						parentDisabled: false,
						parentID: sourceId,
						shortID: visionId.substring(0,9),
						source: "Species",
						sourceID: sourceId,
						type: "Sense",
						valueFormula: {
							flatValue: race[vision]
						}
					});

					childIds.push(visionId);
				}
			}

			// Apply walk speed if it is all that this species has
			if (race.speed.toFixed)
			{
				childIds.push(d20plus.ut.generateRowId());
				attrs.setSpeed(childIds[childIds.length-1], "Walk", "Set Base", race.speed, "Species", sourceId)
			}
			// Otherwise iterate through each
			else
			{
				for (const key in race.speed) {
					childIds.push(d20plus.ut.generateRowId());
					const speedType = key.charAt(0).toUpperCase() + key.slice(1);
					
					// Try to grab walk speed if a number is not provided
					var value = race.speed[key];
					if (!value.toFixed && "walk" in race.speed)
						value = race.speed["walk"];

					attrs.setSpeed(childIds[childIds.length-1], speedType, "Set Base", value, "Species", sourceId)
				}
			}

			// If one already exists, remove it and its children
			attrs.getIntegrantIdsWith("type", "Species").forEach(oldSourceId => {
				attrs.deleteChildIntegrants(oldSourceId);

				attrs.deleteIntegrant(oldSourceId);
			})

			// Apply name to source
			attrs.addIntegrant(sourceId, {
				shortID: sourceId.substring(0,9),
				name: race.name,
				builderDisplayName: "",
				_label: "",
				createdTime:  Date.now(),
				type: "Species",
				_enabled: true,
				source: "",
				childIDs: childIds,
				parentID: "",
				overwriteDisabled: false,
				parentDisabled: false,
				description: "",
				preventSubspecies: false,
				arrayPosition: attrs.getIntegrantCount()
			});

		} else if (d20plus.sheet === "shaped") {
			attrs.addOrUpdate("race", race.name);
			attrs.addOrUpdate("size", (race.size || [Parser.SZ_VARIES]).map(sz => Parser.sizeAbvToFull(sz)).join("/").toUpperCase());
			attrs.addOrUpdate("speed_string", Parser.getSpeedString(race));

			if (race.speed instanceof Object) {
				for (const locomotion of ["walk", "burrow", "climb", "fly", "swim"]) {
					if (race.speed[locomotion]) {
						const attrName = locomotion === "walk" ? "speed" : `speed_${locomotion}`;
						if (locomotion !== "walk") {
							attrs.addOrUpdate("other_speeds", "1");
						}
						// note: this doesn't cover hover
						attrs.addOrUpdate(attrName, race.speed[locomotion]);
					}
				}
			} else {
				attrs.addOrUpdate("speed", race.speed);
			}

			// really there seems to be only darkvision for PCs
			for (const vision of ["darkvision", "blindsight", "tremorsense", "truesight"]) {
				if (race[vision]) {
					attrs.addOrUpdate(vision, race[vision]);
				}
			}

			race.entries.filter(it => it.text).forEach(e => {
				const fRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_racialtrait_${fRowId}_name`, e.name);
				attrs.add(`repeating_racialtrait_${fRowId}_content`, e.text);
				attrs.add(`repeating_racialtrait_${fRowId}_content_toggle`, "1");
			});

			const fRowId = d20plus.ut.generateRowId();
			attrs.add(`repeating_modifier_${fRowId}_name`, race.name);
			attrs.add(`repeating_modifier_${fRowId}_ability_score_toggle`, "1");
			(race.ability || []).forEach(raceAbility => {
				Object.keys(raceAbility).filter(it => it !== "choose").forEach(abilityAbv => {
					const value = raceAbility[abilityAbv];
					const ability = Parser.attAbvToFull(abilityAbv).toLowerCase();
					attrs.add(`repeating_modifier_${fRowId}_${ability}_score_modifier`, value);
				});
			});
		} else {
			// eslint-disable-next-line no-console
			console.warn(`Race import is not supported for ${d20plus.sheet} character sheet`);
		}

		attrs.notifySheetWorkers();
	};
}

SCRIPT_EXTENSIONS.push(d20plusRaces);
