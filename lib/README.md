# Bewegung

An animation experiment of how far you can go with the FLIP technique to become an actual library.

## API

### Syntax

```javascript
const callback = () => {
	// change the dom however you like
};

const options = {
	duration: 1000,
	easing: "ease-in",
};

const animation = bewegung([callback, options]);

animation.play();
```

### Parameters

#### \[your change function here\]

**Single Callback**: If you only need to provide a single animation callback with no specific options, you can simply pass the callback function as the props argument.
**Callback with Options**: If you have specific options for your animation, you can either pass in a duration or an object containing.
**Callback Object**: If you have specific options for your animation, you can either pass in a duration or an object containing.

The `option` object can include these optional fields:

- **duration**: The animation runtime in ms. Defaults to `400`.
- **delay**: The animation runtime in ms. Defaults to `0`.
- **endDelay**: The animation runtime in ms. Defaults to `0`.
- **root**: Defines the upper most parent element for the calculations, so the animation does not affect outside elements. Great for improving performance. Defaults to `body`.
- **easing**: The animation curve / timing function of the animation. Defaults to `ease`.
- **at**: An indication when the corresponding function should be called. Can be relative to the previous function or absolute in time

For full controll you can use a `Callback Object` which allows you to set a `from` and/or a `to` callback. One of them is required.

- **from**: A callback which is executed before the first dom element change is recorded.
- **to**: This is the callback that is used in the other argument variants.

```javascript
bewegung(callback);
bewegung(callback, 1000);
bewegung(callback, options);
bewegung(callbackObject);
bewegung([[callback1, options1], [callback2, options2], config]);
bewegung([callback1, 1000], callback2, callback3);
```

#### Config

This argument is an optional configuration object.

- **defaultOptions** with the default options you can specify options that will be true for all inputs (with still less specificity than the options object for each callback)

### Methods

- **play()**: Starts the animation.
- **pause()**: Pauses the animation.
- **seek(progress: number, done?: boolean)**: This method moves the animation to a specific point, which needs to be a number between 0-1. With the optional done boolean one can indicate whether the seeking action is finished. Can be used to make an animation scrollable
- **cancel()**: This method cancels the animation.
- **finish()**: This method finishes the animation.
- **forceUpdate(index?: number | number[])**: If you know the dom changed from another source (like a browser resize) this function will update either specific entries based on the index. If you dont provide an index, all entries will be recalculated

### Properties

- **finished**: This is a promise that resolves when the animation has finished playing.
- **playState**: This is the current play state of the animation.

## License

[MIT](https://choosealicense.com/licenses/mit/)
