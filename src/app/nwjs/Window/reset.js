import { manifest } from "nwjs/App";
import nwWindow, {
	isMaximized
} from "nwjs/Window";
import nwScreen from "nwjs/Screen";


const { round } = Math;
const {
	window: {
		width: defaultWindowWidth,
		height: defaultWindowHeight
	}
} = manifest;
const { screens } = nwScreen;


export default async function( unmaximize ) {
	const { bounds: { x, y, width, height } } = screens[ 0 ];

	// unmaximize before resetting the window size and position
	if ( unmaximize && isMaximized() ) {
		nwWindow.restore();
	}

	await new Promise( resolve => setTimeout( resolve, 0 ) );

	// reset window: use the default window size and move it to the main screen's center
	nwWindow.resizeTo(
		defaultWindowWidth,
		defaultWindowHeight
	);
	nwWindow.moveTo(
		round( x + ( width - defaultWindowWidth ) / 2 ),
		round( y + ( height - defaultWindowHeight ) / 2 )
	);
}
