define(function (require, exports, module) {

    // Dependencies
    var widgets      = require('dwf/widgets');
    var util         = require('dwf/util');
    var transactions = require('dwf/transactions');
    var ControlPanel = require('dwf/views/control-panel').ControlPanel;
    var FormPreview  = require('dwf/views/form-preview').FormPreview;
    var Messages     = require('dwf/views/messages').Messages;
    var Form         = require('dwf/models/form').Form;

    // Models
    var form = new Form(JSON.parse($('#initial-form')[0].textContent));

    // Views
    var controlPanel = new ControlPanel();
    var formPreview  = new FormPreview();
    var messages     = new Messages();

    var base = document.getElementById('DWF-base');

    controlPanel.activate(base, {
        addField: function (fieldType, widget) {
            util.prompt("Label:", function (label) {
                if (label) {
                    if (form.getFieldByLabel(label)) {
                        util.prompt("A field with that label already exists. Enter a new one:",
                                    arguments.callee);
                    } else {
                        form.addField(label, fieldType, widget);
                        formPreview.addField(label, widget, "", []);
                    }
                }
            });
        },

        activeFieldExists: function () {
            return form.activeField;
        },

        noFieldsExist: function () {
            return !form.hasFields();
        },

        getActiveFieldLabel: function () {
            return form.activeField.label();
        },

        getActiveFieldHelpText: function () {
            return form.activeField.helpText();
        },

        updateActiveFieldLabel: function (val) {
            form.activeField.label(val);
            formPreview.displayActiveFieldLabel(val);
        },

        updateActiveFieldHelpText: function (val) {
            form.activeField.helpText(val);
            formPreview.displayActiveFieldHelpText(val);
        },

        getFormName: function () {
            return form.name();
        },

        getFormDescription: function () {
            return form.description();
        },

        updateFormName: function (val) {
            form.name(val);
            formPreview.displayFormName(val);
        },

        updateFormDescription: function (val) {
            form.description(val);
            formPreview.displayFormDescription(val);
        },

        saveNow: util.bind(transactions.saveNow, transactions)
    });

    formPreview.activate(base, {
        activateField: function (label) {
            form.activeField = form.getFieldByLabel(label);
            controlPanel.openFieldSettingsTab();
        }
    });

    // Have the form preview display the initial form data.
    formPreview.displayFormName(form.name());
    formPreview.displayFormDescription(form.description());
    // TODO: initialize the fields

    messages.activate(document.body);

    // Start saving the form about once every minute.
    transactions.startAutoSaveLoop((function () {
        var msgId;

        return {
            target: document.getElementById('save-target').textContent,
            formId: form.id(),
            preSave: function () {
                controlPanel.disableSave();
                msgId = messages.info('Saving...');
            },
            postSave: function () {
                controlPanel.enableSave();
                messages.removeMessage(msgId);
                var d = new Date();
                messages.success('Successfully saved at '
                                 + (d.getHours() % 12)
                                 + ':' + d.getMinutes());
            },
            error: function () {
                controlPanel.enableSave();
                messages.removeMessage(msgId);
                messages.error('There was an error saving.');
            }
        };
    }()));
});