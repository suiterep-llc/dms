define(['N/query'], function (query) {
  /**
  * @NApiVersion 2.1
  * @NScriptType ClientScript
  * @author Stephen Lemp (SuiteRep)
  * @module /SuiteScripts/dms/transactionCCFee/client.js
  */
  const TRANSACTION_FEE_MESSAGE = `Please note a 2.5% charge will be added on payment submission for all payments via Payment Card.`;

  const GET_IS_CC_QUERY = `
    select
      CASE
        WHEN instrumenttype = 1 THEN 'T'
        ELSE 'F'
      END as ispaymentcard
    from
      paymentcard
    WHERE
      id = ?`;


  function fieldChanged(context) {
    const { fieldId, currentRecord } = context;
    console.log('fieldChanged', { fieldId, ...context });
    if (fieldId == 'paymentoption') {
      const paymentOption = currentRecord.getValue({ fieldId });
      const isPaymentCard = getisPaymentCard(paymentOption);
      console.log(`Payment Option (${paymentOption}) is credit card (${isPaymentCard})`);
      if (isPaymentCard) {
        alert(TRANSACTION_FEE_MESSAGE);
      }
    }
  }


  function saveRecord(context) {
    const paymentOption = currentRecord.getValue({ fieldId });
    const isPaymentCard = getisPaymentCard(paymentOption);
    if (!isPaymentCard) {
      return true;
    }

    return true;
  }


  function getisPaymentCard(paymentOption) {
    if (!paymentOption) return false;

    const queryResults = query.runSuiteQL({ query: GET_IS_CC_QUERY, params: [paymentOption] }).asMappedResults();
    if (queryResults.length != 1) return false;
    return queryResults[0].ispaymentcard == 'T';
  }

  return { saveRecord, fieldChanged };
});