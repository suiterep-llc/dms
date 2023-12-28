
define(['N/url', 'N/https', 'N/ui/dialog', 'N/ui/message', 'N/record'], function (url, https, dialog, msg, record) {
    /**
     * @NApiVersion 2.x
     * @author TJ Cornelius (SuiteRep)
     */
    var exports = {};

    function confirmSendEmail(invoice_number, invoice_id) {
        console.log('client script started');
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
            console.log("Success with value " + JSON.stringify(result));
            if (result == true) {
                var div_id = currentRecord.getValue('department');
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
                var response = https.get({
                    url: suiteletURL
                });
                var confirmMsg = msg.create({
                    title: "Email Sent",
                    message: "An email has been sent to the recipients specified on the BILLING CONTACT EMAIL field. The Sales Rep was CC'ed.",
                    type: msg.Type.CONFIRMATION
                });

                confirmMsg.show({
                    duration: 5000 // will disappear after 5s
                });

                log.debug('response', response);
            }
            return result;
        }

        function failure(reason) {
            console.log("Failure: " + reason);
            var confirmMsg = msg.create({
                title: "Email Failure",
                message: 'Email Failed For Reason: ' + reason.name + ' - ' + reason.message,
                type: msg.Type.WARNING
            });

            confirmMsg.show({
                duration: 30000 // will disappear after 30s
            });
        }

        var confirmed = dialog.confirm(options).then(success).catch(failure);
        console.log('confirmed: ' + JSON.stringify(confirmed));
    }

    exports.confirmSendEmail = confirmSendEmail;
    return exports;
});