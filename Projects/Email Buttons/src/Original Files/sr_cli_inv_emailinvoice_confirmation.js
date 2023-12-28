
define(['N/url', 'N/https', 'N/ui/dialog', 'N/ui/message', 'N/record'], function (url, https, dialog, msg, record) {
    /**
     * Client Script to confirm the sending of an email and then to send it.
     * 
     * @NApiVersion 2.x
     * @author TJ Cornelius (SuiteRep)
     */
    var exports = {};
    var SUBSIDIARY = 1;
    var TEMPLATE_RECORD_ID = 5;

    function confirmSendEmail(invoice_number, invoice_id, div_id) {
        var currentRecord = record.load({
            type: record.Type.INVOICE,
            id: invoice_id
        });

        var emails = '';
        currentRecord.getValue('custbody_invoice_billing_contact_email').split(';').forEach(function (email) {
            emails += '<li>' + email + '</li>';
        });

        var options = {
            title: "Confirm to Email the Customer",
            message: "Are you sure you would like to email this invoice to:\n\t<b><ul>" + emails + '</ul></b>'
        };

        function success(result) {
            if (result == true) {

                //call suitelet
                var suiteletURL = url.resolveScript({
                    scriptId: 'customscript_sr_sut_emailinvoice',
                    deploymentId: 'customdeploy_sr_sut_emailinvoice',
                    returnExternalUrl: false,
                    params: {
                        'invoice_id': invoice_id,
                        'invoice_number': invoice_number,
                        'div_id': div_id
                    }
                });
                console.log('suiteletURL', suiteletURL);
                https.get.promise({
                    url: suiteletURL
                }).then(function (response) {
                    log.debug('response', response);
                    showSuccess(invoice_id);
                }).catch(function (reason) {
                    log.error("failed to send email");
                    showError(reason);
                });
            }
            return result;
        }

        function showSuccess(invoice_id) {
            var confirmMsg = msg.create({
                title: "Email Sent",
                message: "An email has been sent to the recipients specified on the Client's BILLING CONTACT EMAILS (COMBINED) field. The Sales Rep was CC'ed.",
                type: msg.Type.CONFIRMATION
            });
            try {
                var script_url = url.resolveScript({
                    scriptId: 'customscript_template_generate_pdf',
                    deploymentId: 'customdeploy_template_generate_pdf',
                });
                script_url += "&param_transaction_record_type=invoice";
                script_url += "&param_transaction_id=" + invoice_id;
                script_url += "&param_subsidiary=" + SUBSIDIARY;
                script_url += "&param_template_id=" + TEMPLATE_RECORD_ID;
                script_url += "&param_filename=" + TEMPLATE_RECORD_ID;

                window.open(script_url);
            } catch (e) {
                log.error(e.name, e.message);
            }


            confirmMsg.show({
                duration: 5000 // will disappear after 5s
            });

        }

        function showError(message) {
            var confirmMsg = msg.create({
                title: "Email Failure",
                message: "Email Failed For Reason: " + message,
                type: msg.Type.WARNING
            });
            confirmMsg.show({
                duration: 30000 // will disappear after 30s
            });
        }

        function failure(reason) {
            console.log("Failure: " + reason);
            showError(reason);
        }

        var confirmed = dialog.confirm(options).then(success).catch(failure);
        console.log('confirmed: ' + JSON.stringify(confirmed));
    }

    exports.confirmSendEmail = confirmSendEmail;
    return exports;
});