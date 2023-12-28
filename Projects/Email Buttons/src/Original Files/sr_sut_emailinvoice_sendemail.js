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
                    log.error("No Invoice ID passed to SuiteLet");
                    return false;
                }
                if (!div_id) {
                    log.error('No Division passed to Suitelet. Returning null');
                    return null;
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
                        log.error('No Email defined on sales rep record', 'sales rep id: ' + sales_rep_email);
                    }
                } else {
                    log.error('No Sales Rep defined in the Account Manager Field');
                }
                log.debug('sales_rep', sales_rep);

                // var client = clientLookUp.parent;
                // log.debug('client', client)

                // if (!client) {
                //     log.error("issue finding client for this campaign on invoice " + invoice_number, campaign);
                //     return false;
                // }

                // var billToLookUp = search.lookupFields({
                //     type: 'customer',
                //     id: client[0].value,
                //     columns: ['custentitybilling_contact_emai'] // SB: custentitybilling_contact_emailed_combin, PROD: custentitybilling_contact_emai
                // });
                var billToAddresses = clientLookUp.custentitybilling_contact_emai;
                log.debug('billToAddresses', billToAddresses);
                if (!billToAddresses) {
                    log.error("Unable to find Bill To (Combined) addresses");
                    throw "No emails defined on Client Bill To (Combined) field";
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

        exports.onRequest = onRequest;
        return exports;
    });