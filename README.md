# Bewegung

[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/tterb/atomic-design-ui/blob/master/LICENSEs)

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
**Callback with Options**: If you have specific options for your animation, you can pass a tuple consisting of your callback and an options object.

The `option` object can include these optional fields:

- **duration**: The animation runtime in ms. Defaults to `400`.
- **root**: Defines the upper most parent element for the calculations, so the animation does not affect outside elements. Great for improving performance. Defaults to `body`.
- **easing**: The animation curve / timing function of the animation. Defaults to `ease`.
- **at**: An indication when the corresponding function should be called. Can be relative to the previous function or absolute in time

the options object (BewegungsOption) is optional in each tuple. If you do not provide it, the default options (specified in BewegungsConfig or predefined in the function) will be used. You can also mix and match, providing some callbacks with options and others without, or even provide a mix of single callbacks and tuples within the same array

```javascript
bewegung(callback);
bewegung([callback, options]);
bewegung([callback1, options1], [callback2, options2]);
bewegung([callback1, options1], callback2, callback3);
```

#### Config

This argument is an optional configuration object.

- **defaultOptions** with the default options you can specify options that will be true for all inputs (with still less specificity than the option touple input)
- **reduceMotion** the library is sensetive to the users reduced-motion preference. If not wanted, it can be overwritten here

### Methods

**play()**: This method starts the animation.
**pause()**: This method pauses the animation.
**scroll(scrollAmount: number, done?: boolean)**: This method handles scrolling, where scrollAmount indicates how much to scroll and done is an optional boolean that indicates whether the scrolling action is finished.
**cancel()**: This method cancels the animation.
**finish()**: This method finishes the animation.
**forceUpdate(index?: number | number[])**: If you know the dom changed from another source (like a browser resize) this function will update either specific entries based on the index. If you dont provide an index, all entries will be recalculated

### Properties

**finished**: This is a promise that resolves when the animation has finished playing.
**playState**: This is the current play state of the animation.

## License

[MIT](https://choosealicense.com/licenses/mit/)
