define(['SuiteScripts/Email Invoice Button/sr_emailinvoice_lib_client'], function (lib) {
    /**
     * Client Script to confirm the sending of an email and then to send it.
     * 
     * @NApiVersion 2.x
     * @author TJ Cornelius (SuiteRep)
    */
    var exports = {};

    function confirmSendEmail(invoice_number, invoice_id, div_id) {
        try {
            return lib.handleConfirmSendEmail(invoice_number, invoice_id, div_id);
        } catch (e) {
            var error = { title: 'Error in handleConfirmSendEmail - ' + e.name, description: e.message };
            log.error(error);
            console.error(error);
            return false;
        }
    }

    exports.confirmSendEmail = confirmSendEmail;
    return exports;
});
