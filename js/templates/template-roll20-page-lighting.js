function initHTMLPagelightingSettings () {
	d20plus.html = d20plus.html || {};

	// no mods; just switched in to grant full features to non-pro
	d20plus.html.pagelightingSettings = `
		<div class='lighting tab-pane' style='display:none;'>
		<!-- BEGIN MOD -->
		<strong style="display: block; margin-bottom: 10px;">
			<a class="tipsy-w showtip pictos" title="Requires subscription or players to use a betteR20 script">!</a>
			Requires a paid Roll20 subscription or all players to use a betteR20 script
		</strong>
		<!-- END MOD -->
		<div class='border_box lighting_feature' data-feature_enabled='dyn_fog_prototype_enabled' id='dyn_fog_prototype_settings'>
			<div class='alert alert-info' role='alert'>
				<p><a href="https://help.roll20.net/hc/en-us/articles/360052521913" target='' _blank''>Easily convert your legacy settings with the Convert Lighting tool </a></p>
			</div>
			<div class='dyn_fog_settings'>
				<div class='row'>
					<div class='col-xs-6'>
						<p class='dynamic_lighting_title'>Dynamic Lighting</p>
					</div>
					<div class='col-xs-3 dyn_fog_switch'>
						<label class='switch'>
							<input class='dyn_fog_enabled feature_enabled' type='checkbox'>
							<span class='slider round'></span>
							</input>
						</label>
					</div>
				</div>
			</div>
			<hr>
			<div class='explorer_mode'>
				<div class='row'>
					<div class='col-xs-6'>
						<p class='explorer_mode_title'>Explorer Mode</p>
					</div>
					<div class='col-xs-3 dyn_fog_switch'>
						<label class='switch'>
							<input class='dyn_fog_autofog_mode' type='checkbox'>
							<span class='slider round'></span>
							</input>
						</label>
					</div>
				</div>
				<div class='row'>
					<div class='col-xs-11'>
						<p class='description'>Reveals areas of the Map Layer that Players have already explored. Does not reveal areas that were revealed when Explorer Mode is disabled. Previously called "Advanced Fog of War".</p>
					</div>
				</div>
			</div>
			<hr>
			<div class='daylight_mode'>
				<div class='row'>
					<div class='col-xs-6'>
						<p class='explorer_mode_title'>Daylight Mode</p>
					</div>
					<div class='col-xs-3 dyn_fog_switch'>
						<label class='switch'>
							<input class='dyn_fog_global_illum' type='checkbox'>
							<span class='slider round'></span>
							</input>
						</label>
					</div>
				</div>
				<div class='row'>
					<div class='col-xs-11'>
						<p class='description'>Adds Light to the whole Page, good for a sunny day or well lit room or GMs who don't want to place a bunch of torches. Previously called "Global Illumination".</p>
					</div>
				</div>
				<div class='row-fluid clearfix daylight_slider_row' style='display: none;'>
					<div class='span2' style='float:left'>
						<label class='distance'>Brightness</label>
					</div>
					<div class='span8 dyn_fog_switch' style='float:right'>
						<div class='form-group'>
							<div class='input-group flex-group'>
								<img class='dyn_fog_img_left flex-item' src='/images/editor/lightbulb_low.svg'>
								<input class='dyn_fog_daylight_slider flex-item' max='1' min='0.05' step='0.05' type='range' value='1'>
								<img class='dyn_fog_img_right flex-item' src='/images/editor/lightbulb_high.svg'>
							</div>
						</div>
					</div>
				</div>
			</div>
			<hr>
			<div class='update_on_drop_mode'>
				<div class='row'>
					<div class='col-xs-6'>
						<p class='update_on_drop_title'>Update when Token Drop</p>
					</div>
					<div class='col-xs-3 dyn_fog_switch'>
						<label class='switch'>
							<input class='dyn_fog_update_on_drop' type='checkbox'>
							<span class='slider round'></span>
							</input>
						</label>
					</div>
				</div>
				<div class='row'>
					<div class='col-xs-11'>
						<p class='description'>When dragging and dropping a token, the lighting will only change after a player has dropped, not while dragging.</p>
					</div>
				</div>
			</div>
			<hr>
			<div class='gm_darkness_opacity'>
				<div class='row'>
					<div class='col-xs-12'>
						<p class='opacity_title'>GM Darkness Opacity</p>
					</div>
				</div>
				<div class='row'>
					<div class='col-xs-11'>
						<p class='description'>The GM can see through dark areas hidden from the Players when using Dynamic Lighting. This setting adjusts the opacity of those dark areas for the GM only.</p>
					</div>
				</div>
				<div class='row'>
					<div class='col-xs-8'>
						<div class='fogopacity'></div>
					</div>
					<div class='col-xs-1'>
						<input class='opacity_percentage' disabled type='text'>
					</div>
				</div>
			</div>
			<hr>
		</div>
		<div id='legacy_section'>
			<div aria-expanded='false' class='span8' data-target='.collapse_legacy_lighting' data-toggle='collapse' style='display:flex'>
				<p class='token_light_title' style='flex:1'>Advanced & Legacy Settings</p>
				<i aria-expanded='false' class='fa fa-chevron-up collapse_legacy_lighting' style='font-size:20px;cursor: pointer;'></i>
				<i aria-expanded='false' class='fa fa-chevron-down collapse_legacy_lighting' style='font-size:20px;cursor: pointer;'></i>
			</div>
			<div class='collapse collapse_legacy_lighting'>
				<div class='clearfix'>
					<div class='col-xs-7'>
						<p class='light_title'>Legacy Lighting</p>
					</div>
					<div class='col-xs-2 dyn_fog_switch'>
						<label class='switch'>
							<input class='page_settings_enable_legacy_lighting lighting_feature feature_toggle' data-feature_enabled='showlighting' data-target='.legacy_only_section' data-toggle='toggle' type='checkbox'>
							<span class='slider round'></span>
							</input>
						</label>
					</div>
				</div>
				<div class='toggle-element legacy_only_section'>
					<hr>
					<div class='lighting_feature' data-feature_enabled='adv_fow_enabled' id='afow_settings'>
						<label class='feature_name'>
							<strong>Advanced Fog of War</strong>
						</label>
						<div class='feature_options'>
							<input class='advancedfowenabled feature_enabled showtip' type='checkbox' value='1'>
							<label class='checkbox'>&nbsp; Enabled</label>
							<div class='subsettings'>
								<div>
									<input class='advancedfowshowgrid showtip' title='By default the Advanced Fog of War hides the map grid anywhere revealed but the player can no longer see because of Dynamic Lighting. This option makes the grid always visible.' type='checkbox' value='1'>
									<label class='checkbox'>&nbsp; Show Grid</label>
								</div>
								<div>
									<input class='dimlightreveals showtip' title='By default the Advanced Fog of War will not be permanently revealed by Dynamic Lighting that is not bright. This option allows dim lighting to also reveal the fog.' type='checkbox' value='1'>
									<label class='checkbox'>&nbsp; Dim Light Reveals</label>
								</div>
								<div>
									<input class='showtip' id='afow_gm_see_all' title='By default, Advanced Fog of War is only revealed by tokens with sight that are controlled by at least one player.&lt;br&gt;This option allows tokens with sight which are not controlled by anyone to reveal Advanced Fog of War for the GM only.' type='checkbox' value='0'>
									<label class='checkbox'>&nbsp; All Tokens Reveal (GM)</label>
								</div>
								<div id='afow_grid_size' style='width: 180px; line-height: 30px;'>
									<span id='cell_measurement'>Cell Width:</span>
									<input type="number" class="advancedfowgridsize units" value="<$!this.model.get("adv_fow_grid_size")$>" />
									<br>
									<span>x 70 px =</span>
									<input type="number" class="px_advancedfowgridsize pixels" value="<$!this.model.get("adv_fow_grid_size")*70$>" />
									<span>px<sup>*</sup></span>
								</div>
							</div>
						</div>
					</div>
					<div class='lighting_feature' data-feature_enabled='showlighting' id='dynamic_lighting_settings'>
						<label class='feature_name'>
							<strong>Dynamic Lighting</strong>
						</label>
						<div class='feature_options'>
							<input class='lightingenabled feature_enabled showtip' type='checkbox' value='1'>
							<label class='checkbox'>&nbsp; Enabled</label>
							<div class='subsettings'>
								<div>
									<input class='lightenforcelos showtip' title='Player&#39;s line of sight set by what tokens they can control.' type='checkbox' value='1'>
									<label class='checkbox'>&nbsp; Enforce Line of Sight</label>
								</div>
								<div>
									<input class='lightingupdate' type='checkbox' value='1'>
									<label class='checkbox'>&nbsp; Only Update on Drop</label>
								</div>
								<div>
									<input class='lightglobalillum showtip' title='Instead of darkness show light in all places players can see.' type='checkbox' value='1'>
									<label class='checkbox'>&nbsp; Global Illumination</label>
								</div>
							</div>
						</div>
					</div>
					<hr>
					<div class='alert alert-info' role='alert'>
						<p><a href=" https://blog.roll20.net/posts/retiring-legacy-dynamic-lighting-what-you-need-to-know/" target='' _blank''>The sunset has started for Legacy Dynamic Lighting. Convert to Dynamic Lighting now; click to learn more.</a></p>
					</div>
					<hr>
					<div id='gm_darkness_opacity'>
						<label class='feature_name'>
							<strong>Darkness Opacity (GM)</strong>
						</label>
						<div class='fogopacity showtip' title='The GM can see through dark areas hidden from the players when using Fog of War, Advanced Fog of War, and/or Dynamic Lighting. This setting adjusts the opacity of those dark areas for the GM only.'></div>
					</div>
				</div>
			</div>
		</div>
	</div>
	`;
}

SCRIPT_EXTENSIONS.push(initHTMLPagelightingSettings);
