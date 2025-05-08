export const VISIBILITY_OPTIONS = {
	opacityProperty: true,
	visibilityProperty: true,
};

export const isVisible = (element: HTMLElement) => {
	if (!element.checkVisibility(VISIBILITY_OPTIONS)) {
		return false;
	}

	if (element.offsetHeight === 0 || element.offsetWidth === 0) {
		return false;
	}

	if (
		element.offsetHeight === element.parentElement!.offsetHeight &&
		element.offsetWidth === element.parentElement!.offsetWidth
	) {
		return false;
	}

	return true;
};
