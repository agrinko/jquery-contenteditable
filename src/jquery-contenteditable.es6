/*!
 * jQuery UI Contenteditable 1.0.0
 * Lightweight jQuery UI plugin providing more convenient API to use "contenteditable" feature.
 * 
 * Copyright: Alexey Grinko, 2016
 * Git repository: https://github.com/agrinko/jquery-contenteditable.git
 * 
 * @license MIT - https://opensource.org/licenses/MIT
 */
(($) => {
    $.widget("ui.editable", {
        version: "1.0.0",
        widgetEventPrefix: "edit",
        options: {
            content: "self",                    //a selector/jQuery object/HTML element that "contenteditable" attr
                                                //should be applied to; default "self" refers to the element itself
            timeout: false,                     //a delay in ms before firing each "apply" callback; false for no intermediate saving
            multiline: false,                   //if false (default) - prevent "enter" key from adding a line break
            exitKeys: ["escape"],               //keys to finish editing (escape, enter, tab, end, and some other)
            className: "ui-editable",           //class name to be added to editable element permanently
            editingClass: "ui-editable-editing",//class name to be added in editing mode
            invalidClass: "ui-editable-invalid",//class name to be added when validation is not passed
            autoselect: false,                  //whether to automatically select all content when starting editing
            preventUndo: false,                 //whether to prevent default Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y behaviour
            cancel: "a",                        //selector/jQuery object/HTML element click on which does not enable editing

            //callbacks
            start: null,                        //editing was started
            end: null,                          //editing was finished
            input: null,                        //fired after each entered letter; return false to prevent default action
            apply: null,                        //fired when validation is passed and timeout delay has gone
            validate: null                      //return false for incorrect value; content value is the second argument
        },

        keyCode: {
            down: 40,
            end: 35,
            enter: 13,
            escape: 27,
            left: 37,
            right: 39,
            space: 32,
            tab: 9,
            up: 38
        },

        _create() {
            this.ready = false;     //marks if element is ready for editable mode after mousedown event
            this.mode = "normal";   //current state: "normal" or "edit"

            this.element.addClass(this.options.className);
            this.content = (this.options.content == "self" || !this.options.content) ?
                this.element :
                this.element.find(this.options.content);

            this._bindEvents();
        },

        _bindEvents() {
            this._on({
                mousedown: this._prepare,
                mouseup: this._capture,
                dragstart: this._cancel
            });

            this._bindContentEvents();
        },

        _bindContentEvents() {
            this.content
                .on(`keydown${this.eventNamespace}`, this._keydown.bind(this))
                .on(`input${this.eventNamespace}`, this._input.bind(this))
                .on(`blur${this.eventNamespace}`, this.finish.bind(this));
        },

        _prepare(e) {
            //prevent editing when clicking on element referred by "cancel" selector
            if ($(e.target).closest(this.options.cancel).length)
                return;

            if (e.which === 1) //filter left mouse button
                this.ready = true;
        },

        _cancel() {
            this.ready = false;
        },

        _capture() {
            if (!this.ready) return;

            this.start();
            this.ready = false;
        },

        start() {
            if (this.mode === "edit") return;

            if (this.options.start)
                if (this.options.start.call(this.element) === false) return;

            this._mode("edit");
            this.content.focus();

            this.isValid = true;
            this.validContent = this.content.text(); //remember current content as valid

            if (this.options.autoselect)
                this.select();
        },

        finish(e) {
            if (this.mode === "normal") return;

            this._apply();

            if (!this.isValid)
                this.content.text(this.validContent); //reset to last remembered valid content

            this._mode("normal");

            if (!e || e.type != "blur")
                this.content.blur(); //automatically switch focus when finished by pressing "exitKeys"

            if (this.options.end)
                this.options.end.call(this.element);
        },

        validate() {
            let result = true;

            if (this.options.validate)
                result = this.options.validate.call(this.element, this.content.text());

            if (result === false)
                this.element.addClass(this.options.invalidClass);
            else
                this.element.removeClass(this.options.invalidClass);

            return this.isValid = result !== false;
        },

        select() {
            let range = document.createRange();
            let sel = window.getSelection();

            range.selectNodeContents(this.content[0]);
            sel.removeAllRanges();
            sel.addRange(range);
        },

        _mode(m) {
            switch (m) {
                case "edit":
                    this.element.addClass(this.options.editingClass);
                    if (this.element.data("ui-draggable"))
                        this.element.draggable("disable"); //disable draggable plugin when editing content

                    this.content.prop("contenteditable", true);

                    break;

                case "normal":
                    this.element.removeClass([this.options.editingClass, this.options.invalidClass].join(" "));
                    if (this.element.data("ui-draggable"))
                        this.element.draggable("enable");

                    this.content.prop("contenteditable", false);

                    break;
            }

            this.mode = m;
        },

        _input(e) {
            if (this.mode != "edit") return;

            if (this.options.input) {
                let result = this.options.input.call(this.element, e, {
                    content: this.content.text()
                });

                if (result === false)
                    return false;
            }

            if (this.options.timeout === 0)
                this._apply();
            else if (this.options.timeout > 0)
                this._debouncedApply(this.options.timeout);
        },

        _apply() {
            if (!this.validate()) return;

            this.validContent = this.content.text(); //remember new content as valid

            if (this.options.apply)
                this.options.apply(this.validContent);
        },
        //call "_apply" method only after "_debouncedApply" has not been fired during <timeout> ms
        _debouncedApply(timeout) {
            if (this.__apply_timeout)
                clearTimeout(this.__apply_timeout);

            this.__apply_timeout = setTimeout(() => {
                this._apply();
                this.__apply_timeout = null;
            }, timeout);
        },

        _keydown(e) {
            if (this.mode === "normal") return;

            //prevent default browser's undo/redo actions
            if (this.options.preventUndo && e.ctrlKey && (
                e.keyCode === "Z".charCodeAt(0) ||
                e.keyCode === "Y".charCodeAt(0) ||
                e.keyCode === "Z".charCodeAt(0) && e.shiftKey))
                return false;

            if (this.options.exitKeys) {
                let exitKeyPressed = this.options.exitKeys.some((keyName) => {
                    return e.keyCode === this.keyCode[keyName.toLowerCase()]; //get key codes by names in $.ui.keyCode hash
                });

                if (exitKeyPressed) {
                    this.finish();
                    return;
                }
            }

            //prevent 'enter' key from adding line break in non-multi-line mode
            if (!this.options.multiline && e.keyCode === this.keyCode.enter)
                return false;
        },

        _destroy() {
            this.element.removeClass([
                this.options.className,
                this.options.editingClass,
                this.options.invalidClass
            ].join(" "));

            this.content.off(this.eventNamespace);
        }
    });
})(jQuery);