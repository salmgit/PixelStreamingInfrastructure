// Copyright Epic Games, Inc. All Rights Reserved.

export * from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.6';
export * from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6';
import { Config, Flags, Logger, LogLevel, NumericParameters, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.6';
import { Application, PixelStreamingApplicationStyle } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6';
const PixelStreamingApplicationStyles =
    new PixelStreamingApplicationStyle();
PixelStreamingApplicationStyles.applyStyleSheet();

// expose the pixel streaming object for hooking into. tests etc.
declare global {
    interface Window { pixelStreaming: PixelStreaming; }
}

document.body.onload = function() {
    Logger.InitLogging(LogLevel.Warning, true);

	// Create a config object
	const config = new Config({
		initialSettings: { HoveringMouse: true },
		useUrlParams: true });

	config.setFlagEnabled(Flags.AFKDetection, true);
	config.setNumericSetting(NumericParameters.AFKTimeoutSecs, 300);
	config.setNumericSetting(NumericParameters.AFKCountdownSecs, 10);

	// Create the main Pixel Streaming object for interfacing with the web-API of Pixel Streaming
	const stream = new PixelStreaming(config);

	const application = new Application({
		stream,
		onColorModeChanged: (isLightMode) => PixelStreamingApplicationStyles.setColorMode(isLightMode)
	});
	document.body.appendChild(application.rootElement);

	setupExtension(stream);

	window.pixelStreaming = stream;
}

function setupExtension(stream: PixelStreaming) {
	if (chrome && chrome.runtime ) {
		// The ID of the extension we want to talk to.
		const extensionId = "aomhlmbihphkkjopmekhgmjbfalpljja";

		const port = chrome.runtime.connect(extensionId);

		try {
			port.onMessage.addListener(message => {
				console.log(message);
				stream.emitUIInteraction({
					"command": "SwitchTile",
					"tileA": message.left,
					"TileB": message.middle,
					"floor": message.right
				});
			});
			port.postMessage({command: "activate_camera"});
		} catch(e) {
			console.log(e);
		}

		document.addEventListener("visibilitychange", () => {
			if(document.hidden && port)
				port.postMessage({command: "deactivate_camera"});
			else
				port.postMessage({command: "activate_camera"});
		})
		
	} else console.error("Tag_tracker extension not installed!");
}