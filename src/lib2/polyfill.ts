const requestIdleCallbackPolyfill = (callback: IdleRequestCallback) => {
	const start = Date.now();
	return setTimeout(
		() =>
			callback({
				didTimeout: false,
				timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
			}),
		1
	);
};

window.requestIdleCallback =
	window.requestIdleCallback || requestIdleCallbackPolyfill;

window.cancelIdleCallback =
	window.cancelIdleCallback ||
	function (id) {
		clearTimeout(id);
	};
