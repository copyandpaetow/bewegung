export const ObserveBrowserResize = (allElements: HTMLElement[], callback: () => void) => {
	let allResizeObserver = new WeakMap<HTMLElement, ResizeObserver>();
	
	allElements.forEach((element) => {
		allResizeObserver.get(element)?.disconnect();

		let firstTime = true;
		const RO = new ResizeObserver(() => {
			if (firstTime) {
				firstTime = false;
				return;
			}
			callback();
		});

		RO.observe(element);
		allResizeObserver.set(element, RO);
		return RO;
	});

	return {
		disconnect: () => {
			allElements.forEach((element) => {
				allResizeObserver.get(element)?.disconnect();
			});
			allResizeObserver = new WeakMap<HTMLElement, IntersectionObserver>();
		},
	};
};
