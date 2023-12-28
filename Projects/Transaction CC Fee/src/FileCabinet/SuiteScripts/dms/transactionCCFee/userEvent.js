/**
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Stephen Lemp (SuiteRep)
 */
define(['./commonLibrary', 'N/record'], function (library, record) {
  const FEE_PERCENTAGE = .025;

  const CC_FEE_ITEM = 1408;
  const FIELDS_TO_COPY = ['entity', 'department'];
  const ITEM_SUBLIST_FIELDS_TO_COPY = ['custcol_atlas_flightstart_d', 'custcol_agency_mf_flight_end_date', 'custcol_atlas_flightend_d', 'custcol_agency_mf_flight_start_date'];
  /**
   *
   * @param {Object} context
   * @param {Record} context.newRecord  Record as submitted to server
   * @param {String} context.type  The type of UE with which the record is being accessed (create, copy, edit)
   * @return {void}
   */
  function afterSubmit(context) {
    const { type, UserEventType, newRecord } = context;
    if (type != UserEventType.CREATE) return;

    const paymentOption = newRecord.getValue('paymentoption');
    const isPaymentCard = library.getIsPaymentCard(paymentOption);
    log.debug(`Creating Payment ${newRecord.id}`, { paymentOption, isPaymentCard });
    if (!isPaymentCard) return false;

    const invoiceId = createConvenienceFeeInvoice(newRecord);
    log.debug('created CC Fee invoice', invoiceId);
    const convenienceFeePaymentId = createConvenienceFeePayment(invoiceId, newRecord);
    log.debug('created CC Fee payment', convenienceFeePaymentId);

  }


  function createConvenienceFeePayment(invoiceId, newRecord) {
    const paymentRecord = record.transform({ fromType: 'invoice', toType: 'customerpayment', fromId: invoiceId });
    paymentRecord.setValue({ fieldId: 'paymentoption', value: newRecord.getValue('paymentoption') });
    return paymentRecord.save();
  }


  function createConvenienceFeeInvoice(newRecord) {
    const recordObject = record.create({ type: record.Type.INVOICE, defaultValues: { customform: 99 } });
    const paymentTotalAmount = newRecord.getValue('total');
    const sublistId = 'item';

    for (const fieldId of FIELDS_TO_COPY) {
      recordObject.setValue({ fieldId, value: newRecord.getValue({ fieldId }) });
    }

    console.log('setting amount', paymentTotalAmount * FEE_PERCENTAGE);
    recordObject.setSublistValue({ line: 0, fieldId: 'item', sublistId, value: 1408 });
    recordObject.setSublistValue({ line: 0, fieldId: 'amount', sublistId, value: paymentTotalAmount * FEE_PERCENTAGE });


    for (const fieldId of ITEM_SUBLIST_FIELDS_TO_COPY) {
      const value = newRecord.getSublistValue({ sublistId, fieldId, line: 0 });
      console.log('setting value of fieldId', { fieldId, value });
      if (value) recordObject.setSublistValue({ line: 0, fieldId, sublistId, value });
    }
    return recordObject.save({ ignoreMandatoryFields: true });
  }

  return { afterSubmit };
});
