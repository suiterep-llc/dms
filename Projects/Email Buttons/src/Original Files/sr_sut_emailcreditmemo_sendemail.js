define(['N/record', 'N/email', 'N/format', 'N/search', 'N/render', 'N/runtime'],
    function(record, email, format, search, render, runtime) {
        /**
         * @module moduleName this example creates a Suitelet form that lets you write and send an email
         * @NApiVersion 2.x
         * @NScriptType Suitelet
         * @author Stephen Lemp (SuiteRep LLC)
         */
        var exports = {};
        var BILLTO_DELIMITER = ';';

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
                var creditmemo_id = parseInt(context.request.parameters.creditmemo_id);
                var authorId = current_user.id;

                log.debug('current_user', current_user);
                log.debug('creditmemo_id', creditmemo_id);

                if (!creditmemo_id) {
                    log.error("No CM ID passed to SuiteLet")
                    return false;
                }

                var rec = record.load({
                    type: record.Type.CREDIT_MEMO,
                    id: creditmemo_id
                });

                //Set variables to pass to the template
                var creditmemo_number = rec.getValue('tranid');
                var amountDue = rec.getValue('amountremaining');
                var dueDate = rec.getValue('duedate');
                var subject = 'Credit Memo ' + creditmemo_number + ' from Digital Media Solutions';
                var div_id = rec.getValue('department');


                var div_lookup = search.lookupFields({
                    type: 'department',
                    id: div_id,
                    columns: ['custrecord_div_inv_email_author', 'custrecord_div_inv_email_subject']
                });
                log.debug('div_lookup', div_lookup)

                var email_author;
                if (div_lookup.custrecord_div_inv_email_author && div_lookup.custrecord_div_inv_email_author[0] && div_lookup.custrecord_div_inv_email_author[0].value) {
                    email_author = div_lookup.custrecord_div_inv_email_author[0].value;
                } else {
                    email_author = authorId
                }
                log.debug('email_author', email_author)

                dueDate = 'null'
                amountDue = format.format({
                    value: amountDue,
                    type: format.Type.CURRENCY
                });
                amountDue = '$' + amountDue;

                log.debug('creditmemo_number', creditmemo_number);
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
                log.debug('sales_rep', sales_rep)

                // var client = clientLookUp.parent;
                // log.debug('client', client)

                // if (!client) {
                //     log.error("issue finding client for this campaign on credit memo " + creditmemo_number, campaign);
                //     return false;
                // }

                // var billToLookUp = search.lookupFields({
                //     type: 'customer',
                //     id: client[0].value,
                //     columns: ['custentitybilling_contact_emai']
                // });
                // PROD: custentitybilling_contact_emai
                // SAND: custentitybilling_contact_emailed_combin
                var billToAddresses = clientLookUp.custentitybilling_contact_emai
                log.debug('billToAddresses', billToAddresses);
                if (!billToAddresses) {
                    log.error("Unable to find Bill To (Combined) addresses");
                    throw "No emails defined on Client Bill To (Combined) field"
                }

                var creditmemoPDF = render.transaction({
                    entityId: creditmemo_id,
                    printMode: render.PrintMode.PDF
                });

                var mergeResult = render.mergeEmail({
                    templateId: 3,
                    entity: null,
                    recipient: null,
                    supportCaseId: null,
                    transactionId: creditmemo_id,
                    custmRecord: null
                });

                var body = mergeResult.body;
                log.debug('body', body);

                email.send({
                    author: email_author,
                    cc: sales_rep_email ? sales_rep_email.split() : null,
                    recipients: billToAddresses.split(BILLTO_DELIMITER),
                    subject: subject,
                    body: body,
                    attachments: [creditmemoPDF],
                    relatedRecords: {
                        transactionId: creditmemo_id
                    }
                });
                return;

            } else {

            }
        }

        exports.onRequest = onRequest;
        return exports;
    });