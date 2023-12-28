define(['./commonLibrary'], function (library) {
  /**
  * @NApiVersion 2.1
  * @NScriptType ClientScript
  * @author Stephen Lemp (SuiteRep)
  * @module /SuiteScripts/dms/transactionCCFee/client.js
  */
  const FEE_PERCENTAGE = 2.5;
  const TRANSACTION_FEE_MESSAGE = `Please note a ${FEE_PERCENTAGE}% charge will be added on payment submission for all payments via Payment Card.`;
  const CONFIRM_CC_FEE_MESSAGE = `Please confirm your agreement to be charged a ${FEE_PERCENTAGE}% convenience fee for using a Payment Card. Click "Ok" to confirm or "Cancel" to go back and update payment method.`;


  function fieldChanged(context) {
    const { fieldId, currentRecord } = context;
    console.log('fieldChanged', { fieldId, ...context });
    if (fieldId == 'paymentoption') {
      const paymentOption = currentRecord.getValue({ fieldId });
      const isPaymentCard = library.getIsPaymentCard(paymentOption);
      console.log(`Payment Option (${paymentOption}) is credit card (${isPaymentCard})`);
      if (isPaymentCard) {
        // alert(TRANSACTION_FEE_MESSAGE);
      }
    }
  }


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

  return { saveRecord, fieldChanged };
});