"use strict";

/**
 * Created by Agrinko on 23-Jul-16.
 */
(function ($) {
    $.widget("ui.editable", {
        version: "1.0.0",
        widgetEventPrefix: "edit",
        options: {
            content: "self",
            timeout: false,
            multiline: false,
            exitKeys: ["escape"],
            className: "ui-editable",
            editingClass: "ui-editable-editing",
            invalidClass: "ui-editable-invalid",
            autoselect: false,

            //callbacks
            start: null,
            end: null,
            input: null,
            apply: null,
            validate: null
        },

        _create: function _create() {
            this.ready = false;
            this.mode = "normal";

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
            if (e.which === 1) this.ready = true;
        },
        _cancel: function _cancel() {
            this.ready = false;
        },
        _capture: function _capture() {
            if (!this.ready) return;

            this.start();
            this.ready = false;
        },
        start: function start() {
            if (this.mode === "edit") return;

            if (this.options.start) if (this.options.start.call(this.element) === false) return;

            this._mode("edit");
            this.content.focus();

            this.isValid = true;
            this.validContent = this.content.text();

            if (this.options.autoselect) this.select();
        },
        finish: function finish(e) {
            if (this.mode === "normal") return;

            if (!this.isValid) this.content.text(this.validContent);

            this._mode("normal");

            if (!e || e.type != "blur") this.content.blur();

            if (this.options.end) this.options.end.call(this.element);
        },
        validate: function validate() {
            var result = true;

            if (this.options.validate) result = this.options.validate.call(this.element, this.content.text());

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
                    if (this.element.data("ui-draggable")) this.element.draggable("disable");

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

            if (this.options.input) {
                var result = this.options.input.call(this.element, e, {
                    content: this.content.text()
                });

                if (result === false) return false;
            }

            if (this.options.timeout) this._debouncedApply(e, this.options.timeout);else this._apply(e);
        },
        _apply: function _apply(e) {
            if (!this.validate()) return;

            this.validContent = this.content.text();

            this.options.apply(e, {
                content: this.validContent
            });
        },
        _debouncedApply: function _debouncedApply(e, timeout) {
            var _this = this;

            if (this.__apply_timeout) clearTimeout(this.__apply_timeout);

            this.__apply_timeout = setTimeout(function () {
                _this._apply(e);
                _this.__apply_timeout = null;
            }, timeout);
        },
        _keydown: function _keydown(e) {
            if (this.mode === "normal") return;

            if (e.ctrlKey && (e.keyCode === "Z".charCodeAt(0) || e.keyCode === "Y".charCodeAt(0) || e.keyCode === "Z".charCodeAt(0) && e.shiftKey)) return false;

            if (this.options.exitKeys) {
                var exitKeyPressed = this.options.exitKeys.some(function (keyName) {
                    return e.keyCode === $.ui.keyCode[keyName.toUpperCase()];
                });

                if (exitKeyPressed) {
                    this.finish();
                    return;
                }
            }

            if (!this.options.multiline && e.keyCode === $.ui.keyCode.ENTER) return false;
        },
        _destroy: function _destroy() {
            this.element.removeClass([this.options.className, this.options.editingClass, this.options.invalidClass].join(" "));

            this.content.off(this.eventNamespace);
        }
    });
})(jQuery);