define(['./commonLibrary'], function (library) {
  /**
  * @NApiVersion 2.1
  * @NScriptType ClientScript
  * @author Stephen Lemp (SuiteRep)
  * @module /SuiteScripts/dms/transactionCCFee/client.js
  */
  const FEE_PERCENTAGE = 2.5;
  const CONFIRM_CC_FEE_MESSAGE = `Please confirm your agreement to be charged a ${FEE_PERCENTAGE}% convenience fee for using a Payment Card. Click "Ok" to confirm or "Cancel" to go back and update payment method.`;


  function saveRecord(context) {
    const { currentRecord } = context;
    const paymentOption = currentRecord.getValue({ fieldId: 'paymentoption' });
    const isPaymentCard = library.getIsPaymentCard(paymentOption);
    if (!isPaymentCard) {
      return true;
    } else {
      return confirm(CONFIRM_CC_FEE_MESSAGE);
    }
  }

  return { saveRecord };
});