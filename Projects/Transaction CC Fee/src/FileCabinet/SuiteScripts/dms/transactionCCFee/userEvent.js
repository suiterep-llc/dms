/**
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Stephen Lemp (SuiteRep)
 */
define(['./commonLibrary', 'N/record'], function (library, record) {

  const FEE_PERCENTAGE = .025;
  const CC_FEE_ITEM = 1408;
  const DMS_CC_FEE_INVOICE_FORM_ID = 214;
  const FIELDS_TO_COPY = ['entity', 'department'];

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

    record.submitFields({ ...newRecord, values: { custbody_dms_relatedccfeerecord: invoiceId } });
  }


  function createConvenienceFeePayment(invoiceId, newRecord) {
    const paymentRecord = record.transform({ fromType: 'invoice', toType: 'customerpayment', fromId: invoiceId });
    paymentRecord.setValue({ fieldId: 'paymentoption', value: newRecord.getValue('paymentoption') });
    paymentRecord.setValue({ fieldId: 'custbody_dms_relatedccfeerecord', value: newRecord.id });

    return paymentRecord.save();
  }


  function createConvenienceFeeInvoice(newRecord) {
    log.debug('customer', newRecord.getValue('customer'));
    const recordObject = record.create({
      type: record.Type.INVOICE,
      defaultValues: {
        customform: DMS_CC_FEE_INVOICE_FORM_ID,
        entity: Number(newRecord.getValue('customer'))
      }
    });

    recordObject.setValue({ fieldId: 'custbody_dms_relatedccfeerecord', value: newRecord.id });
    const paymentTotalAmount = newRecord.getValue('total');
    const sublistId = 'item';

    recordObject.setSublistValue({ line: 0, fieldId: 'item', sublistId, value: CC_FEE_ITEM });
    recordObject.setSublistValue({ line: 0, fieldId: 'amount', sublistId, value: paymentTotalAmount * FEE_PERCENTAGE });

    return recordObject.save({ ignoreMandatoryFields: true });
  }

  return { afterSubmit };
});
