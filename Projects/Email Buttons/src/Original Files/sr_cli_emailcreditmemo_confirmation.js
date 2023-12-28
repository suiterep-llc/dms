
define(['N/url', 'N/https', 'N/ui/dialog', 'N/ui/message'], function (url, https, dialog, msg) {
    /**
     * Client Script to confirm the sending of an email and then to send it.
     * 
     * @NApiVersion 2.x
     * @author TJ Cornelius (SuiteRep)
     */
    var exports = {};

    function confirmSendEmail(creditmemo_number, creditmemo_id) {
        var options = {
            title: "Confirm to Email the Customer",
            message: "Are you sure you would like to email this credit memo?"
        };

        function success(result) {
            if (result == true) {

                //call suitelet
                var suiteletURL = url.resolveScript({
                    scriptId: 'customscript_sr_sut_cm_emailcreditmemo',
                    deploymentId: 'customdeploy_sr_sut_cm_emailcreditmemo',
                    returnExternalUrl: false,
                    params: {
                        'creditmemo_id': creditmemo_id,
                        'creditmemo_number': creditmemo_number
                    }
                });
                console.log('suiteletURL', suiteletURL)
                https.get.promise({
                    url: suiteletURL
                }).then(function (response) {
                    log.debug('response', response);
                    showSuccess()
                }).catch(function (reason){
                    log.error("failed to send email")
                    showError(reason);
                })
            }
            return result;
        }

        function showSuccess(){
            var confirmMsg = msg.create({
                title: "Email Sent",
                message: "An email has been sent to the recipients specified on the Client's BILLING CONTACT EMAILS (COMBINED) field. The Sales Rep was CC'ed.",
                type: msg.Type.CONFIRMATION
            });

            confirmMsg.show({
                duration: 5000 // will disappear after 5s
            });

        }

        function showError(message){
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