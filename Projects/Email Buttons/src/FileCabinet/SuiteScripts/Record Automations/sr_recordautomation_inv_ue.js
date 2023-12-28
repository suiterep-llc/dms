define(['SuiteScripts/Email Invoice Button/sr_emailinvoice_lib_server'], function (lib) {
    /**
     * Adds button and defines the function that should be called in the associated Client script.
     * 
     * Deploy To: Invoices
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
        try {
            lib.handleBeforeLoad(context);
        } catch (e) {
            log.error('Error in handleBeforeLoad - ' + e.name, e.message);
        }
    }

    exports.beforeLoad = beforeLoad;
    return exports;
});