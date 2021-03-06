import {
	module,
	test
} from "qunit";
import {
	runAppend,
	runDestroy,
	getElem,
	buildOwner,
	fixtureElement
} from "test-utils";
import {
	setOwner,
	$,
	HTMLBars,
	Component,
	EventDispatcher,
	Service
} from "ember";
import embeddedHtmlLinksComponentInjector
	from "inject-loader?-utils/getStreamFromUrl!components/link/EmbeddedHtmlLinksComponent";

const { compile } = HTMLBars;

let eventDispatcher, owner, context;


module( "components/link/EmbeddedHtmlLinksComponent", {
	beforeEach() {
		eventDispatcher = EventDispatcher.create();
		eventDispatcher.setup( {}, fixtureElement );
		owner = buildOwner();
		owner.register( "event_dispatcher:main", eventDispatcher );
	},

	afterEach() {
		//noinspection JSUnusedAssignment
		runDestroy( context );
		runDestroy( eventDispatcher );
		runDestroy( owner );
		owner = context = null;
	}
});


test( "EmbeddedHtmlLinksComponent", assert => {

	assert.expect( 40 );

	let event;
	let expectedSetClipboard;
	let expectedOpenBrowser;

	const EmbeddedHtmlLinksComponent = embeddedHtmlLinksComponentInjector({
		"nwjs/Clipboard": {
			set( url ) {
				assert.strictEqual( url, expectedSetClipboard, "Calls setClipboard()" );
			}
		},
		"nwjs/Shell": {
			openBrowser( url ) {
				assert.strictEqual( url, expectedOpenBrowser, "Calls openBrowser()" );
			}
		},
		"nwjs/Menu": {
			create: () => ({
				items: {
					pushObjects( objs ) {
						assert.ok( Array.isArray( objs ), "Creates a context menu" );
						assert.propEqual(
							objs.mapBy( "label" ),
							[
								"Open in browser",
								"Copy link address"
							],
							"Context menu has the correct item labels"
						);
						objs.forEach( obj => obj.click() );
					}
				},
				popup( e ) {
					assert.strictEqual( e, event, "Calls menu.popup( event )" );
				}
			})
		}
	})[ "default" ];
	owner.register( "component:embedded-html-links", EmbeddedHtmlLinksComponent );

	owner.register( "service:-routing", Service.extend({
		transitionTo( route, model ) {
			assert.strictEqual( route, "channel", "Transitions to the channel route" );
			assert.strictEqual( model, "foo", "Channel has the correct model" );
		}
	}) );

	context = Component.extend({
		content: [
			"<a href='https://twitch.tv/foo'>foo</a>",
			"<a href='https://bar.com'>bar.com</a>"
		].join( "<br>\n" ),
		layout: compile( "{{#embedded-html-links}}{{{content}}}{{/embedded-html-links}}" )
	}).create();
	setOwner( context, owner );

	runAppend( context );

	expectedOpenBrowser = "https://bar.com/";

	const $anchors = getElem( context, "a" );
	const $anchorOne = $anchors.eq( 0 );
	const $anchorTwo = $anchors.eq( 1 );

	assert.ok( !$anchorOne.hasClass( "external-link" ), "First link is not external" );
	// trigger mouseup events
	// left click
	event = $.Event( "mouseup", { button: 0 } );
	$anchorOne.trigger( event );
	assert.ok( event.isDefaultPrevented(), "Left click: default event action is prevented" );
	assert.ok( event.isImmediatePropagationStopped(), "Left click: event doesn't propagate" );
	// middle click (doesn't execute transition)
	event = $.Event( "mouseup", { button: 1 } );
	$anchorOne.trigger( event );
	assert.ok( !event.isDefaultPrevented(), "Middle click: default event action is not prevented" );
	assert.ok( !event.isImmediatePropagationStopped(), "Middle click: event does propagate" );
	// right click (doesn't execute transition)
	event = $.Event( "mouseup", { button: 2 } );
	$anchorOne.trigger( event );
	assert.ok( !event.isDefaultPrevented(), "Right click: default event action is not prevented" );
	assert.ok( !event.isImmediatePropagationStopped(), "Right click: event does propagate" );
	// doesn't have a context menu
	event = $.Event( "contextmenu" );
	$anchorOne.trigger( event );
	assert.ok( !event.isDefaultPrevented(), "Contextmenu: default event action is not prevented" );
	assert.ok( !event.isImmediatePropagationStopped(), "Contextmenu: event does propagate" );

	assert.ok( $anchorTwo.hasClass( "external-link" ), "Second link is external" );
	assert.strictEqual(
		$anchorTwo.prop( "title" ),
		"https://bar.com/",
		"Second link has a title property"
	);
	// trigger mouseup events
	// left click
	event = $.Event( "mouseup", { button: 0 } );
	$anchorTwo.trigger( event );
	assert.ok( event.isDefaultPrevented(), "Left click: default event action is prevented" );
	assert.ok( event.isImmediatePropagationStopped(), "Left click: event doesn't propagate" );
	// middle click
	event = $.Event( "mouseup", { button: 1 } );
	$anchorTwo.trigger( event );
	assert.ok( event.isDefaultPrevented(), "Middle click: default event action is prevented" );
	assert.ok( event.isImmediatePropagationStopped(), "Middle click: event doesn't propagate" );
	// right click (doesn't execute callback)
	event = $.Event( "mouseup", { button: 2 } );
	$anchorTwo.trigger( event );
	assert.ok( !event.isDefaultPrevented(), "Right click: default event action is not prevented" );
	assert.ok( !event.isImmediatePropagationStopped(), "Right click: event does propagate" );
	// has a context menu
	expectedOpenBrowser = "https://bar.com/";
	expectedSetClipboard = "https://bar.com/";
	event = $.Event( "contextmenu" );
	$anchorTwo.trigger( event );
	assert.ok( event.isDefaultPrevented(), "Contextmenu: default event action is prevented" );
	assert.ok( event.isImmediatePropagationStopped(), "Contextmenu: event doesn't propagate" );
	// disabled events
	"mousedown click dblclick keyup keydown keypress"
		.split( " " )
		.forEach( name => {
			const eventOne = $.Event( name );
			const eventTwo = $.Event( name );
			$anchorOne.trigger( eventOne );
			assert.ok(
				!eventOne.isDefaultPrevented(),
				`First link: default ${name} action is not prevented`
			);
			$anchorTwo.trigger( eventTwo );
			assert.ok(
				eventTwo.isDefaultPrevented(),
				`Second link: default ${name} action is prevented`
			);
		});

});
