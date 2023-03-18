export function highlightSuccessFailure(app, html, data) {
	if ( !app.flags.isRoll ) return;
	const value = html.find(".d20-roll .dice-total").text();
	if ( app.flags.critical === "failure" ) {
		html.find(".d20-roll .dice-total").addClass("failure");
		html.find(".d20-roll .dice-total").text( game.i18n.format("SHADOWDARK.roll.critical.failure", { value: value }));
	}
	else if ( app.flags.critical === "success" ) {
		html.find(".d20-roll .dice-total").addClass("success");
		html.find(".d20-roll .dice-total").text( game.i18n.format("SHADOWDARK.roll.critical.success", { value: value }));
	}
	else if ( app.flags.hasTarget && app.flags.success ) {
		html.find(".d20-roll .dice-total").addClass("success");
		html.find(".d20-roll .dice-total").text( game.i18n.format("SHADOWDARK.roll.success", { value: value }) );
	}
	else if ( app.flags.hasTarget && !app.flags.success ) {
		html.find(".d20-roll .dice-total").addClass("failure");
		html.find(".d20-roll .dice-total").text( game.i18n.format("SHADOWDARK.roll.failure", { value: value }) );
	}
}

/**
 * Handles the rendering of a chat message to the log
 * @param {ChatLog} app - The ChatLog instance
 * @param {jQuery} html - Rendered chat message html
 * @param {object} data - Data passed to the render context
 */
export default function onRenderChatMessage(app, html, data) {
	highlightSuccessFailure(app, html, data);
}
