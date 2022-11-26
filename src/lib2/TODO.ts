/*
Notes

StructuredClone
- cant use a weakMap since it gets copied and is not the same anymore, Symbols and functions are not supported
- functions could get serialized though, if they are pure


reading the dom
- if we do the steps "apply, read, revert", we can chunk the reading and send readout steps
=> for every step (after the first one) we can calculate that particular keyframe
=> an answer to the upload would naturally create a sheduler
=> we would need to reverse the timing order though, because we need the last keyframe to calculate the differences
=> if we also send a progress like index/timing.length-1 we know when the last entry arrived

*/

//use strings everywhere and have a dictonary for the domElements
//? could we use weakmaps on both sides and strings only for the transport?

const entry = {
	element: "unique1",
	parent: "unique2",
	root: "unique4",
	chunks: ["chunkID1", "chunkID2"],
};

const mappingStructure = new Map<string, Record<string, string | string[]>>();
mappingStructure.set("unique1", entry);

const domStructure = new Map<string, HTMLElement>();
const domStructure2 = {
	unique1: document.createElement("a"),
	unique2: document.createElement("br"),
	unique3: document.createElement("canvas"),
};

const element1 = domStructure.get(entry.element);
const element2 = domStructure2[entry.element];

/*
client
- normalize: prop unifiying (needs the KeyframeEffect)
- normalize: normalizing Targets (needs the DOM) 
- normalize: normalizing Options (needs the KeyframeEffect*)
- prepare: finding affected elements (needs the DOM) 
- prepare: updating callback offsets (function cant be cloned)
- prepare: saving and restoring the element style (needs the DOM)
- read: reading the dom changes (needs the DOM)
- read: check if the element is a text node (needs the DOM)
- read: setting up the before and after callbacks (functions cant be cloned)
- read: creating the wrapper elements for the image keyframes (needs the DOM)
- read: getting the image ration (needs the DOM)
- watch: MO, IO, RO 

web-worker
- normalize:normalizing keyframes and updating easings
- prepare: connecting secondary elements to their primary elements option**
- prepare: calculating totalRuntime 
- prepare: updating keyframes
- read: calc change timings and -properties, appliable keyframes
- read: updating the readouts 
- read: calculating the override- and the resulting styles
- read: easing calculation
- read: default keyframe calculation
- read: image keyframes: calc placeholder and wrapper styles & keyframes***, maximum dimensions, easings, 

- * could maybe be done without it
- ** the setting of the options here could be done differently
- *** the ratio would need to be provided

further requirements

- until all dom elements are gathered, we need to work with chunks. Maybe it would be good if they also had an id

- one main element can be included in several chunks, so it can has multiple keyframes, options, selectors
=> this also means that secondary elements can depend on several chunks


*/

const element = document.createElement("div").classList.add("card");

const unifiedProps = [
	{
		target: ".card",
		keyframes: { opacity: [1, 0, 1] },
		options: 400,
		id: "chunkID1",
	},
	{
		target: element,
		keyframes: [{ margin: "0" }, { margin: "2rem", callback: () => console.log("here") }],
		options: { duration: 800, rootElement: "main" },
		id: "chunkID2",
	},
];

//separated into keyframes. options, targets, etc

const keyframes = {
	chunkID1: [{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }],
	chunkID2: [{ margin: "0" }, { margin: "2rem" }],
};

const targets = {
	unique1: {
		element: "unique1",
		parent: "unique2",
		root: "unique4",
		type: "image" || "text" || "default",
		chunks: ["chunkID1", "chunkID2"],
	},
};

Object.values(targets).forEach((entry) => entry.chunks.forEach((chunkId) => keyframes[chunkId]));
