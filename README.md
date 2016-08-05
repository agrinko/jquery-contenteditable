# jQuery UI Contenteditable

Lightweight jQuery UI plugin providing more convenient API to use "contenteditable" feature.

It allows you to make contents of HTML element easily editable using a single click.

## Features

- Extremely lightweight!
- Using native HTML "contenteditable" attribute, in opposite to other similar plugins using inputs and textareas.
It has its own pros and cons, however:
  - :+1: Automatically supports original styling of editable element (as there's no need to replace it with masked input field)
  - :+1: Automatic HTML escaping which "contenteditable" provides out of box (which might be browser-specific, though)
  - :-1: Lower browsers compatibility (read [more](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable))
- Validation
- Convenient API for saving edited value
- No conflicts with jQuery UI Draggable plugin (distinguishes between single click and dragging intent)
- Source code in 3 samples: *ES 2015*, *ES 5.1* and *ES 5.1 minified*
- jQuery UI widget-styled. It means **dependency on jQuery UI** widget factory, which is most likely a negative feature.

## Disclaimer

The plugin was written as a part of a bigger project and so was first of all intended to fit its goals.
That's why it actually uses *contenteditable* attribute and jQuery UI dependency. It was published just in case it
might be useful for someone else having the same needs.

I admit it might be not highly flexible, but still don't have enough time to improve it and reply to all the found issues.

In the same time I am encouraging any contribution and ready to help with any questions.

It's my first public repo, don't blame me much ;)

## Example

Download the repo folder and open `index.html` in your browser.

It uses some self-explaining examples to demonstrate widget's abilities.

An example of multi-line editable block which saves value (alerts it for demo) each 600ms and forbids empty values:

```javascript
$("#selector").editable({
    multiline: true,
    saveDelay: 600, //wait 600ms before calling "save" callback
    autoselect: true, //select content automatically when editing starts
    save: function(content) {
        //here you can save content to your MVC framework's model or send directly to server...
        alert("Saving actual content: " + content);
    },
    validate: function(content) {
        //here you can validate content using RegExp or any other JS code to return false for invalid input
        return content !== "";
    }
});
```

## Installation

Download one of the versions from [src](./src) directory (either EcmaScript 6 full, EcmaScript 5 full or EcmaScript 5
minified). Attach it as a script after jQuery and jQuery UI dependencies (you need at least jQuery UI Widget module).
For example:

```html
<body>
    <h2 id="editable">
        Basic examples. Click on me to edit. Press 'ESC' or 'Tab' or click anywhere else to finish editing.
    </h2>
    <script src="https://code.jquery.com/jquery-3.1.0.min.js"></script>
    <script src="https://code.jquery.com/ui/1.12.0/jquery-ui.min.js"></script>
    <script src="src/jquery-contenteditable.min.js"></script>
    <script>
        $("#editable").editable();
    </script>
</body>
```

### Repository

If you want to contribute or research the repo, clone it and run `npm install`.

Then run `npm run-script build` each time you want to compile and minify ES6 source code.

## API

### Settings

#### content

Type: `String|JQuery|HTMLElement`

Default: `"self"`

Refers to an element which will be actually edited (assignee of "contenteditable" attribute).

While editable mode gets triggered after click on the whole widget's element, you may want to edit only specific part
of this element. See more in demo.

Default value `self` refers to the element itself.

#### cancel

Type: `String|JQuery|HTMLElement`

Default: `"a"`

Refers to an element inside of the widget, which shouldn't trigger editable mode. E.g. you may want to open link
by click instead editing it. See more in demo.

Default value `a` refers to all links inside of editable element.

#### saveDelay

Type: `boolean|number`

Default: `false`

Indicates a delay in milliseconds before calling `save` callback, when no typing occurs during this delay. Similar to
delay of `_.debounce()` method in *UnderscoreJS*.

You may want to periodically store intermediate value during edition, e.g. in Local Storage or on server to not lose it
accidentally. Callback `save` is used for this purpose. But in order to not call it on each keypress, you may want to
set a delay. Use `saveDelay` property to specify this delay.

Default value `false` means no intermediate saving and only invoking `save` after the end of editing. Set it to 0
for no delay in intermediate saving.

#### multiline

Type: `boolean`

Default: `false`

Indicates whether to allow multiline editing.

If set to `false`, prevents `Enter` key from adding a line break.

#### exitKeys

Type: `string[]`

Default: `["escape"]`

Keys that trigger finishing edit-mode. Note that editing also automatically finishes by `blur` event (i.e. when element
loses focus).

Possible keys: `escape|enter|space|left|right|down|up|end|space|tab`

#### autoselect

Type: `boolean`

Default: `false`

Indicates whether to automatically select all content when starting editing.

#### preventUndo

Type: `boolean`

Default: `false`

Indicates whether to prevent default browser's undo/redo actions on `Ctrl+Z`, `Ctrl+Shift+Z` or `Ctrl+Y` shortcuts.

Might be useful if you have own commands management mechanism and browser's default one interferes.

#### className

Type: `string`

Default: `"ui-editable"`

Class name to be added to editable element permanently.

#### editingClass

Type: `string`

Default: `"ui-editable-editing"`

Class name to be added in edit-mode.

Use it to style content being edited. E.g. you may want to scale content or change its color using this class name.

#### invalidClass

Type: `string`

Default: `"ui-editable-invalid"`

Class name to be added when validation is not passed.

Use it to style invalid content. E.g. you may want to highlight it with red background.

### Callbacks

#### start(): boolean|void

Invoked when editing mode switches on (i.e. after click on the element).

Return false if you need to prevent switching to edit-mode.

#### end(): void

Invoked after editing mode switches off (i.e. after *blur* event or after pressing `exitKeys`).

#### input(event: Event, ui: {content: string}): boolean|void

Invoked after each key pressing.

Refer to `ui.content` to get the actual content of the element.

Return false e.g. if you want to prevent entering certain letters or the whole input for specific `ui.content` values`.

#### validate(event: Event, ui: {content: string}): boolean|void

Invoked each time before `save` callback is invoked to validate the actual content.

Return `false` if content is invalid, and anything else otherwise.

If the value was considered invalid when exiting edit-mode, the last valid value (which was passed to `save` callback)
is restored.

The basic case is to check if value is not empty:

```javascript
validate: function(e, ui) {
    return ui.content !== "";
}
```

#### save(event: Event, ui: {content: string}): void

Invoked each time you need to save validated value, e.g. to Local Storage or to server. Frequency of its calls is
regulated by `saveDelay` option (read more above).

It guarantees the value is valid relying on `validate` callback.
The callback will not be invoked if preceding `validate` callback returns false.

### Methods

#### start

Use it if you want to start editing content programmatically on already initialized editable instance:

```javascript
$("#element").editable("start");
```

#### finish

To programmatically finish editing:

```javascript
$("#element").editable("finish");
```

#### select

To programmatically select the content (even without entering editing mode):

```javascript
$("#element").editable("select");
```

This is needed because simple `$("#element").select()` seems not to work on contenteditable elements.

### Events

As typical jQuery UI widget, jQuery Selectable triggers same events as callbacks available, prefixed with "edit-":

- editstart
- editend
- editinput
- editvalidate
- editsave

## TODO

There are many desirable features to implement, will leave them here for the future:

- Automated tests
- Test in different browsers
- Support different events triggering edit-mode, other than single click
- Start editing by focus event, e.g. when focusing with `Tab` button
- Support touch events
- Add 'handle' option to specify which part of element should trigger edit-mode
- Ensure HTML escape in all browsers to prevent XSS attacks
- Predefined set of validations (nonempty, maxlength, minlength, etc)
- Invoke validation after each input (now it's invoked only before 'save' callback which might be too long)
- More verbose demo
- Bugs:
  - using ctrl+c/ctrl+v user is able to paste any HTML from other sites, though the widget is only intended for simple text

*Alexey Grinko, 2016 (c)* 
