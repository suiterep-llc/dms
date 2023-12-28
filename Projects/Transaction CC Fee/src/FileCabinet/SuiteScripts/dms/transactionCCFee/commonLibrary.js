define(['N/query'], function (query) {
  /**
  * @author Stephen Lemp (SuiteRep)
  * @module /SuiteScripts/dms/transactionCCFee/commonLibrary.js
  */

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


  function getIsPaymentCard(paymentOption) {
    if (!paymentOption) return false;

    const queryResults = query.runSuiteQL({ query: GET_IS_CC_QUERY, params: [paymentOption] }).asMappedResults();
    if (queryResults.length != 1) return false;
    return queryResults[0].ispaymentcard == 'T';
  }



  return { getIsPaymentCard };
});