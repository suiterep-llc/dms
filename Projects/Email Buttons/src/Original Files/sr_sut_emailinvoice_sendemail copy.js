define(['N/record', 'N/email', 'N/format', 'N/search', 'N/render', 'N/runtime'],
    function (record, email, format, search, render, runtime) {
        /**
         * @module moduleName this example creates a Suitelet form that lets you write and send an email
         * @NApiVersion 2.x
         * @NScriptType Suitelet
         * @author Stephen Lemp (SuiteRep LLC)
         */
        var exports = {};
        var BILLTO_DELIMITER = ';';
        var DEFAULT_EMAIL_SUBJECT = 'Digital Media Solutions';
        var INVOICE_EMAIL_TEMPLATE_ID = 2;

        /**
         * @function onRequest Definition of the Suitelet script trigger point.
         * @governance XXX
         * 
         * @param {Object} params
         * @param {http.ServerRequest} params.request The incoming request.
         * @param {http.ServerResponse} params.response The Suitelet response.
         *
         * @return {void}
         * @since 2015.2
         */
        function onRequest(context) {
            if (context.request.method === 'GET') {
                var current_user = runtime.getCurrentUser();
                var invoice_id = parseInt(context.request.parameters.invoice_id);
                var div_id = parseInt(context.request.parameters.div_id);
                var invoice_number = context.request.parameters.invoice_number;
                //var subject = 'Invoice ' + invoiceNumber + ' from Digital Media Solutions';
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

                // LOOKUP BILLING CONTACT EMAILS (COMBINED)
                var campaign = rec.getValue('entity');
                var clientLookUp = search.lookupFields({
                    type: 'customer',
                    id: campaign,
                    columns: ['parent', 'custentity_atlas_m_em_acctman', 'custentitybilling_contact_emai']
                });
                log.debug('clientLookUp', clientLookUp);
                var sales_rep;
                var sales_rep_email;
                if (clientLookUp.custentity_atlas_m_em_acctman[0]) {
                    sales_rep = clientLookUp.custentity_atlas_m_em_acctman[0].value;
                    var salesRepLookUp = search.lookupFields({
                        type: 'employee',
                        id: sales_rep,
                        columns: ['email']
                    });
                    log.debug('salesRepLookUp', salesRepLookUp);
                    sales_rep_email = salesRepLookUp.email;
                    if (!sales_rep_email) {
                        errorMessage = 'No email defined on Sales Rep record';
                        log.error(errorMessage, 'sales rep id: ' + sales_rep_email);
                        scriptError(2, errorMessage);
                    }
                } else {
                    errorMessage = 'No Sales Rep defined in the Account Manager Field';
                    log.error(errorMessage);
                    scriptError(3, errorMessage);
                }
                log.debug('sales_rep', sales_rep);

                var billToAddresses = rec.getValue('custbody_invoice_billing_contact_email'); //clientLookUp.custentitybilling_contact_emai;
                log.debug('billToAddresses', billToAddresses);
                if (!billToAddresses) {
                    errorMessage = 'No emails defined on this invoice\'s "Billing Contact Email" field';;
                    log.error("Unable to find Billing contact addresses");
                    scriptError(4, errorMessage);
                }
                // END GET BILLING CONTACT EMAILS (COMBINED)

                //START PDF RENDER
                var invoicePDF = render.transaction({
                    entityId: invoice_id,
                    printMode: render.PrintMode.PDF
                });
                //END PDF RENDER

                //START EMAIL MERGE
                var mergeResult = render.mergeEmail({
                    templateId: INVOICE_EMAIL_TEMPLATE_ID,
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
                    cc: sales_rep_email ? sales_rep_email : null,
                    recipients: billToAddresses.split(BILLTO_DELIMITER),
                    subject: email_subject,
                    body: body,
                    attachments: [invoicePDF],
                    relatedRecords: {
                        transactionId: invoice_id
                    }
                });
                return;

            } else {

            }
        }

        function scriptError(errorNumber, message) {
            var thrownError = new Error(message);
            thrownError.name = ['MISSING_INVOICE_ID', 'MISSING_DIVISION', 'MISSING_SALES_REP_EMAIL', 'MISSING_SALES_REP', 'MISSING_BILLING_ADDRESSES'][errorNumber];
            throw thrownError;
        }

        exports.onRequest = onRequest;
        return exports;
    });