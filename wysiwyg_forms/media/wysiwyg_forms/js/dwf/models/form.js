define(function (require, exports, module) {
    var transactions = require('dwf/transactions');
    var util = require('dwf/util');
    var Field = require('dwf/models/field').Field;

    var Form = exports.Form = function (initialData) {
        this._id = initialData.id;
        this._name = initialData.name;
        this._description = initialData.description;
        this._fields = [];

        for ( var i = 0, len = initialData.fields.length; i < len; i++ ) {
            this._fields.push(new Field(initialData.fields[i]));
        }

        this.activeField = null;
    };

    Form.prototype.id = function () {
        return this._id;
    };

    Form.prototype.description = util.getSetter('_description', function (val) {
        transactions.addTransaction({
            action : "change description",
            to     : val
        });
    });

    Form.prototype.name = util.getSetter('_name', function (val) {
        transactions.addTransaction({
            action : "change name",
            to     : val
        });
    });

    Form.prototype.hasFields = function () {
        return this._fields.length > 0;
    };

    Form.prototype.addField = function (label, fieldType, widget) {
        var f = new Field({
            label: label,
            type: fieldType,
            widget: widget,
            help_text: '',
            required: true,
            choices: []
        });
        this._fields.push(f);

        transactions.addTransaction({
            action : "add field",
            label  : label
        });
        transactions.addTransaction({
            action : "change field type",
            label  : label,
            to     : fieldType
        });
        transactions.addTransaction({
            action : "change field widget",
            label  : label,
            to     : widget
        });

        return f;
    };

    Form.prototype.deleteField = function (label) {
        var field, idx;
        this.eachField(function (f, i) {
            if ( f.label() === label ) {
                field = f;
                idx = i;
                return false;
            }
        });
        if ( field ) {
            this._fields.splice(idx, 1);
            transactions.addTransaction({
                action: 'remove field',
                label: field.label()
            });
            if ( field === this.activeField ) {
                delete this.activeField;
            }
        } else {
            throw Error('Can\'t delete a a field that doesn\'t exist');
        }
    };

    Form.prototype.getFieldByLabel = function (label) {
        for ( var i = 0, len = this._fields.length; i < len; i++ ) {
            if ( label === this._fields[i].label() ) {
                return this._fields[i];
            }
        }
        return null;
    };

    // Should guarantee order of the fields.
    Form.prototype.eachField = function (cb, ctx) {
        var i = 0;
        var len = this._fields.length;
        var ret = true;
        ctx = ctx || {};
        for ( ; i < len && ret !== false; i ++ ) {
            ret = cb.call(ctx, this._fields[i], i);
        }
    };
});