
define(['N/url', 'N/https', 'N/ui/dialog', 'N/ui/message', 'N/record'], function (url, https, dialog, msg, record) {
    /**
     * Client Script library to handle confirming the sending of an email and then to send it.
     * @author TJ Cornelius (SuiteRep)
     */
    var exports = {};

    function handleConfirmSendEmail(invoice_number, invoice_id, div_id) {
        var currentRecord = record.load({
            type: record.Type.INVOICE,
            id: invoice_id
        });

        var revised = currentRecord.getValue('custbody_sr_invrevised');

        var emails = '';
        currentRecord.getValue('custbody_invoice_billing_contact_email').split(';').forEach(function (email) {
            emails += '<li>' + email + '</li>';
        });

        var options = {
            title: "Confirm to Email the Customer",
            message: "Are you sure you would like to email this invoice " + (revised ? "<i>revision</i> " : '') + "to:\n\t<b><ul>" + emails + '</ul></b>'
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
                }).then(function (httpResponse) {
                    log.debug('response', httpResponse);
                    showSuccess(httpResponse);
                }).catch(function (reason) {
                    log.error("failed to send email");
                    showError(reason);
                });
            }
            return result;
        }

        function failure(reason) {
            console.log("Failure: " + reason);
            showError(reason);
        }

        var confirmed = dialog.confirm(options).then(success).catch(failure);
        console.log('confirmed: ' + JSON.stringify(confirmed));
    }

    function showError(reason) {
        var confirmMsg = msg.create({
            title: "Email Failure",
            message: "Email Failed For Reason: " + reason.message,
            type: msg.Type.WARNING
        });
        confirmMsg.show({
            duration: 30000 // will disappear after 30s
        });
    }

    function showSuccess(httpResponse) {
        var confirmMsg = msg.create({
            title: "Email Sent",
            message: "An email has been sent to the recipients specified on the Client's BILLING CONTACT EMAILS (COMBINED) field. The Sales Rep was CC'ed.",
            type: msg.Type.CONFIRMATION
        });
        try {
            window.open(httpResponse.body);
        } catch (e) {
            log.error(e.name, e.message);
        }

        confirmMsg.show({
            duration: 5000 // will disappear after 5s
        });

    }

    exports.handleConfirmSendEmail = handleConfirmSendEmail;
    return exports;
});