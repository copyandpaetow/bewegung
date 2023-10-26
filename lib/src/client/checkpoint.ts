export const createCheckPointAnimation = (
	effect: KeyframeEffect,
	timeline?: DocumentTimeline | null
): Animation => {
	let startTime = 0;
	let endTime = 0;

	const computedTiming = effect.getTiming();
	startTime = computedTiming.delay as number;
	endTime = startTime + (computedTiming.duration as number);

	const handler = {
		get(target: Animation, property: keyof Animation) {
			const value = Reflect.get(target, property);

			if (typeof value !== "function") {
				return value;
			}

			if (property === "play") {
				target.effect!.updateTiming({ duration: 0, delay: startTime, endDelay: 0 });
			}
			if (property === "reverse") {
				target.effect!.updateTiming({ duration: 0, delay: 0, endDelay: endTime });
			}

			return function (...args: any[]) {
				return Reflect.apply(value, target, args);
			}.bind(target);
		},

		set(target: Animation, property: keyof Animation, value: any) {
			if (property === "currentTime" && value >= startTime && value <= endTime) {
				target.finish();
			}

			return Reflect.set(target, property, value);
		},
	};

	const animation = new Animation(effect, timeline);
	return new Proxy(animation, handler);
};
