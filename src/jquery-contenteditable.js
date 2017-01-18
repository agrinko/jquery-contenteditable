"use strict";

/*!
 * jQuery UI Contenteditable 1.0.0
 * Lightweight jQuery UI plugin providing more convenient API to use "contenteditable" feature.
 * 
 * Copyright: Alexey Grinko, 2016
 * Git repository: https://github.com/agrinko/jquery-contenteditable.git
 * 
 * @license MIT - https://opensource.org/licenses/MIT
 */
(function ($) {
    $.widget("ui.editable", {
        version: "1.0.0",
        widgetEventPrefix: "edit",
        options: {
            content: "self", //a selector/jQuery object/HTML element that "contenteditable" attr
            //should be applied to; default "self" refers to the element itself
            saveDelay: false, //a delay in ms before firing each "save" callback; false for no intermediate saving
            multiline: false, //if false (default) - prevent "enter" key from adding a line break
            exitKeys: ["escape"], //keys to finish editing (escape, enter, tab, end, and some other)
            className: "ui-editable", //class name to be added to editable element permanently
            editingClass: "ui-editable-editing", //class name to be added in editing mode
            invalidClass: "ui-editable-invalid", //class name to be added when validation is not passed
            autoselect: false, //whether to automatically select all content when starting editing
            preventUndo: false, //whether to prevent default Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y behaviour
            cancel: "a", //selector/jQuery object/HTML element click on which does not enable editing

            //callbacks
            start: null, //editing was started
            end: null, //editing was finished
            input: null, //fired after each entered letter; return false to prevent default action
            save: null, //fired when validation is passed and saveDelay delay has gone
            validate: null //return false for incorrect value; content value is the second argument
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

        _create: function _create() {
            this.ready = false; //marks if element is ready for editable mode after mousedown event
            this.mode = "normal"; //current state: "normal" or "edit"

            this.element.addClass(this.options.className);
            this.content = this.options.content == "self" || !this.options.content ? this.element : this.element.find(this.options.content);

            this._bindEvents();
        },
        _bindEvents: function _bindEvents() {
            this._on({
                mousedown: this._prepare,
                mouseup: this._capture,
                dragstart: this._cancel
            });

            this._bindContentEvents();
        },
        _bindContentEvents: function _bindContentEvents() {
            this.content.on("keydown" + this.eventNamespace, this._keydown.bind(this)).on("input" + this.eventNamespace, this._input.bind(this)).on("blur" + this.eventNamespace, this.finish.bind(this));
        },
        _prepare: function _prepare(e) {
            //prevent editing when clicking on element referred by "cancel" selector
            if ($(e.target).closest(this.options.cancel).length) return;

            if (e.which === 1) //filter left mouse button
                this.ready = true;
        },
        _cancel: function _cancel() {
            this.ready = false;
        },
        _capture: function _capture() {
            if (!this.ready) return;

            this.start();
            this.ready = false;
        },
        getText: function getText() {
            return this.content[0].innerText || this.content[0].textContent; // for browsers compatibility
        },
        start: function start() {
            if (this.mode === "edit") return;

            //Trigger event + callbacks
            if (this._trigger("start") === false) return false;

            this._mode("edit");
            this.content.focus();

            this.isValid = true;
            this.validContent = this.getText(); //remember current content as valid

            if (this.options.autoselect) this.select();
        },
        finish: function finish(e) {
            if (this.mode === "normal") return;

            this._save();

            if (!this.isValid) this.content.text(this.validContent); //reset to last remembered valid content

            this._mode("normal");

            if (!e || e.type != "blur") this.content.blur(); //automatically switch focus when finished by pressing "exitKeys"

            //Trigger event + callbacks
            this._trigger("end");
        },
        validate: function validate() {
            //Trigger event + callbacks
            var result = this._trigger("validate", null, {
                content: this.getText()
            });

            if (result === false) this.element.addClass(this.options.invalidClass);else this.element.removeClass(this.options.invalidClass);

            return this.isValid = result !== false;
        },
        select: function select() {
            var range = document.createRange();
            var sel = window.getSelection();

            range.selectNodeContents(this.content[0]);
            sel.removeAllRanges();
            sel.addRange(range);
        },
        _mode: function _mode(m) {
            switch (m) {
                case "edit":
                    this.element.addClass(this.options.editingClass);
                    if (this.element.data("ui-draggable")) this.element.draggable("disable"); //disable draggable plugin when editing content

                    this.content.prop("contenteditable", true);

                    break;

                case "normal":
                    this.element.removeClass([this.options.editingClass, this.options.invalidClass].join(" "));
                    if (this.element.data("ui-draggable")) this.element.draggable("enable");

                    this.content.prop("contenteditable", false);

                    break;
            }

            this.mode = m;
        },
        _input: function _input(e) {
            if (this.mode != "edit") return;

            //Trigger event + callbacks
            var ui = {
                content: this.getText()
            };

            if (this._trigger("input", e, ui) === false) {
                return false;
            }

            if (this.options.saveDelay === 0) this._save();else if (this.options.saveDelay > 0) this._debouncedSave(this.options.saveDelay);
        },
        _save: function _save() {
            var text = this.getText();

            if (text == this.validContent) //if content has not changed
                return;

            if (!this.validate()) return;

            this.validContent = text; //remember new content as valid

            //Trigger event + callbacks
            this._trigger("save", null, {
                content: this.validContent
            });
        },


        //call "_save" method only after "_debouncedSave" has not been fired during <saveDelay> ms
        _debouncedSave: function _debouncedSave(timeout) {
            var _this = this;

            if (this.__save_timeout) clearTimeout(this.__save_timeout);

            this.__save_timeout = setTimeout(function () {
                _this._save();
                _this.__save_timeout = null;
            }, timeout);
        },
        _keydown: function _keydown(e) {
            var _this2 = this;

            if (this.mode === "normal") return;

            //prevent default browser's undo/redo actions
            if (this.options.preventUndo && e.ctrlKey && (e.keyCode === "Z".charCodeAt(0) || e.keyCode === "Y".charCodeAt(0) || e.keyCode === "Z".charCodeAt(0) && e.shiftKey)) return false;

            if (this.options.exitKeys) {
                var exitKeyPressed = this.options.exitKeys.some(function (keyName) {
                    return e.keyCode === _this2.keyCode[keyName.toLowerCase()]; //get key codes by names in $.ui.keyCode hash
                });

                if (exitKeyPressed) {
                    this.finish();
                    return;
                }
            }

            //prevent 'enter' key from adding line break in non-multi-line mode
            if (!this.options.multiline && e.keyCode === this.keyCode.enter) return false;
        },
        _destroy: function _destroy() {
            this.element.removeClass([this.options.className, this.options.editingClass, this.options.invalidClass].join(" "));

            this.content.off(this.eventNamespace);
        }
    });
})(jQuery);