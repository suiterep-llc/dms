define([], function () {

    /**
     * Adds button and defines the function that should be called in the associated Client script.
     * 
     * Deploy To: Credit Memos
     * @NApiVersion 2.x
     * @NScriptType UserEventScript
     * @author TJ Cornelius (SuiteRep)
     */
    var exports = {};


    /**
     * @function beforeLoad Function to be executed after record is submitted to server.
     * @governance 0
     * 
     * @param {Object} context 
     * @param {Record} context.newRecord  The new record.
     * @param {serverWidget.Form} context.form The current form.
     * @param {String} context.type The type of operation invoked by the event.
     * @param {http.ServerRequest} context.request The HTTP request information sent by the browser. If the event was triggered by a server action, this value is not present.
     * 
     * @return {void}
     * @since 2015.2
     */


    function beforeLoad(context) {
        if (context.type !== context.UserEventType.VIEW) { return; }
        var cm_number = context.newRecord.getValue('tranid');
        var cm_id = context.newRecord.id;

        try {
            var functionCall = 'confirmSendEmail(\"' + cm_number + '\",\"' + cm_id + '\")';
            log.debug('functionCall', functionCall)
            context.form.addButton({
                id: 'custpage_btn_confirmsendemail',
                label: 'Email Credit Memo',
                functionName: functionCall
            });
            context.form.clientScriptModulePath = 'SuiteScripts/sr_cli_emailcreditmemo_confirmation.js';
        } catch (error) {
            log.error('error', error);
        }
    }

    exports.beforeLoad = beforeLoad;
    return exports;
});