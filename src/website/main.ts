document.addEventListener(
	"DOMContentLoaded",
	() => {
		console.log("init");
		test();
		test2();
	},
	false
);

const once = (callback: () => void) => () => {
	let didRun = false;
	return () => {
		if (!didRun) {
			callback();
			didRun = true;
		}
	};
};

const afterwards = (callback: () => void) => () => queueMicrotask(callback);

const test = () => {
	const testSet = new Set();
	const arr = [1, 2, 3, 4, 5];
	let didRun = false;
	let now = performance.now();

	arr.forEach((num) => {
		testSet.add(num);
		queueMicrotask(() => {
			if (!didRun) {
				console.log("callback");
				didRun = true;
			}
		});
	});

	arr.forEach((num) => {
		console.log("after");
	});
	console.log("later");
};

const test2 = () => {
	setTimeout(() => console.log("later later"));
};
