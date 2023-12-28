define(['N/record', 'N/email', 'N/format', 'N/search', 'N/render', 'N/runtime'],
    function (record, email, format, search, render, runtime) {

        /**
         * @author TJ Cornelius (SuiteRep)
         */

        var exports = {};
        var EMAIL_DELIMITER = ';';
        var DEFAULT_EMAIL_SUBJECT = 'Digital Media Solutions';
        var INVOICE_EMAIL_TEMPLATE_ID = 2;

        /**
         * @function handleBeforeLoad Function handler for beforeLoad function; see @function beforeLoad.
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
        function handleBeforeLoad(context) {
            if (context.type !== context.UserEventType.VIEW) { return; }
            var invoiceNumber = context.newRecord.getValue('tranid');
            var div_id = context.newRecord.getValue('department');
            var invoice_id = context.newRecord.id;

            try {
                if (div_id != 17) {
                    var functionCall = 'confirmSendEmail("' + invoiceNumber + '","' + invoice_id + '","' + div_id + '")';
                    log.debug('functionCall', functionCall);
                    context.form.addButton({
                        id: 'custpage_btn_confirmsendemail',
                        label: 'Email Invoice',
                        functionName: functionCall
                    });
                    context.form.clientScriptModulePath = 'SuiteScripts/Record Automations/sr_recordautomation_inv_cli.js';
                }
            } catch (error) {
                log.error('error', error);
            }
        }

        function handleSuiteletRequest(context) {
            if (context.request.method === 'GET') {
                var current_user = runtime.getCurrentUser();
                var invoice_id = parseInt(context.request.parameters.invoice_id);
                var div_id = parseInt(context.request.parameters.div_id);
                var invoice_number = context.request.parameters.invoice_number;
                var authorId = current_user.id;

                log.debug('div_id', div_id);
                log.debug('current_user', current_user);
                log.debug('invoice_id', invoice_id);
                log.debug('invoice_number', invoice_number);

                if (!invoice_id) {
                    errorMessage = "No Invoice ID was provided.";
                    log.error(errorMessage);
                    scriptError(0, errorMessage);
                }
                if (!div_id) {
                    errorMessage = 'No Division ID was provided';
                    log.error(errorMessage);
                    scriptError(1, errorMessage);
                }
                var div_lookup = search.lookupFields({
                    type: 'department',
                    id: div_id,
                    columns: ['custrecord_div_inv_email_author', 'custrecord_div_inv_email_subject']
                });
                log.debug('div_lookup', div_lookup);

                var email_subject = div_lookup.custrecord_div_inv_email_subject;
                if (!email_subject) {
                    email_subject = 'Invoice #' + invoice_number + ' ' + DEFAULT_EMAIL_SUBJECT;
                } else {
                    email_subject = 'Invoice #' + invoice_number + ' ' + email_subject;
                }

                var email_author;
                if (div_lookup.custrecord_div_inv_email_author && div_lookup.custrecord_div_inv_email_author[0] && div_lookup.custrecord_div_inv_email_author[0].value) {
                    email_author = div_lookup.custrecord_div_inv_email_author[0].value;
                } else {
                    email_author = authorId;
                }
                log.debug('email_author', email_author);
                var rec = record.load({
                    type: record.Type.INVOICE,
                    id: invoice_id
                });

                //Set variables to pass to the template
                var invoiceNumber = rec.getValue('tranid');
                var amountDue = rec.getValue('amountremaining');
                var dueDate = rec.getValue('duedate');

                //variables to indicate whether invoice was revised.
                var revised = rec.getValue('custbody_sr_invrevised');
                var revision_memo = rec.getValue('custbody_sr_invrevisionmemo');

                dueDate = format.format({
                    value: dueDate,
                    type: format.Type.DATE
                });
                amountDue = format.format({
                    value: amountDue,
                    type: format.Type.CURRENCY
                });
                amountDue = '$' + amountDue;

                log.debug('invoiceNumber', invoiceNumber);
                log.debug('dueDate', dueDate);
                log.debug('amountDue', amountDue);

                log.debug('revised', revised);
                log.debug('revision memo', revision_memo);

                // LOOKUP BILLING CONTACT EMAILS (COMBINED)
                var contacts = lookupBillingContactEmails(rec);
                var billToAddresses = contacts[0];
                var sales_rep_email = contacts[1];
                // END GET BILLING CONTACT EMAILS (COMBINED)

                //START PDF RENDER
                var invoicePDF = render.transaction({
                    entityId: invoice_id,
                    printMode: render.PrintMode.PDF
                });
                //Updated by: Melchi------
                //END PDF RENDER
                var departmentSearch = search.lookupFields({
                    type: 'invoice',
                    id: invoice_id,
                    columns: 'department'
                });
                log.debug("department", departmentSearch);
                //START EMAIL MERGE
                var isPam = false;
                if (departmentSearch.department && departmentSearch.department.length > 0 && departmentSearch.department[0].value == 17) {
                    //isPam = true;  //commenting out since we do not yet have the go ahead for this.
                }
                var mergeResult = render.mergeEmail({
                    templateId: isPam ? 4 : INVOICE_EMAIL_TEMPLATE_ID, //there should be a way to do this automatically.
                    //-------------
                    entity: null,
                    recipient: null,
                    supportCaseId: null,
                    transactionId: invoice_id,
                    custmRecord: null
                });

                var body = mergeResult.body;
                log.debug('body', body);
                //END EMAIL MERGE

                email.send({
                    author: email_author,
                    cc: sales_rep_email ? sales_rep_email.split(EMAIL_DELIMITER) : null,
                    recipients: billToAddresses.split(EMAIL_DELIMITER),
                    subject: (revised === true ? 'Revised ' : '') + email_subject,
                    body: body,
                    attachments: [invoicePDF],
                    relatedRecords: {
                        transactionId: invoice_id
                    }
                });

                context.response.write(invoicePDF.url);
                return;
            }
        }

        function scriptError(errorNumber, message) {
            var thrownError = new Error(message);
            thrownError.name = ['MISSING_INVOICE_ID', 'MISSING_DIVISION', 'MISSING_SALES_REP_EMAIL', 'MISSING_SALES_REP', 'MISSING_BILLING_ADDRESSES'][errorNumber];
            throw thrownError;
        }

        function lookupBillingContactEmails(invoiceRecord) {
            var sales_rep = invoiceRecord.getValue('salesrep');
            var sales_rep_email;
            if (sales_rep) {
                var salesRepLookUp = search.lookupFields({
                    type: 'employee',
                    id: sales_rep,
                    columns: ['email']
                });
                log.debug('salesRepLookUp', salesRepLookUp);
                sales_rep_email = salesRepLookUp.email;
                if (!sales_rep_email) {
                    errorMessage = 'No email defined on Sales Rep record';
                    log.error(errorMessage, 'sales rep id: ' + sales_rep);
                    //scriptError(2, errorMessage);
                }
            } else {
                errorMessage = 'No Sales Rep defined in the Sales Rep Field';
                log.error(errorMessage);
                //scriptError(3, errorMessage); - ask Stephen about this.
            }
            log.debug('sales_rep', sales_rep);

            var billToAddresses = invoiceRecord.getValue('custbody_invoice_billing_contact_email'); //clientLookUp.custentitybilling_contact_emai;
            log.debug('billToAddresses', billToAddresses);
            if (!billToAddresses) {
                errorMessage = 'No emails defined on this invoice\'s "Billing Contact Email" field';;
                log.error("Unable to find Billing contact addresses");
                scriptError(4, errorMessage);
            }

            return [billToAddresses, sales_rep_email];
        }


        exports.handleSuiteletRequest = handleSuiteletRequest;
        exports.handleBeforeLoad = handleBeforeLoad;
        return exports;
    });