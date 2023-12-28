define(['N/workflow', 'N/record'], function (workflow, record) {
  /**
   * @description When bank details are modified for a Vendor, 
   * this script will trigger a workflow to reapprove Vendor.
   *
   * @deployment Bank Details
   * @NApiVersion 2.1
   * @NScriptType UserEventScript
   * @author Ben Rogol (SuiteRep)
   * @module /dms/core/reapproveVendorForBankDetailsChange
   */

  /**
   * @function beforeSubmit Function to be executed before record is submitted to server.
   * @param {Object} context
   * @param {Record} context.newRecord  Record as submitted to server
   * @param {Record} context.oldRecord  Record as loaded from server
   * @param {String} context.type  The type of UE with which the record is being accessed (create, copy, edit)
   */
  function beforeSubmit(context) {
    try {
      const oldBankAccountNumber = context.oldRecord.getValue('custrecord_2663_entity_acct_no');
      const newBankAccountNumber = context.newRecord.getValue('custpage_eft_custrecord_2663_entity_acct_no');
      const oldBankNumber = context.oldRecord.getValue('custrecord_2663_entity_bank_no');
      const newBankNumber = context.newRecord.getValue('custpage_eft_custrecord_2663_entity_bank_no');
      if (oldBankAccountNumber === newBankAccountNumber && oldBankNumber === newBankNumber) return;

      const vendorRecordId = context.newRecord.getValue('custrecord_2663_parent_vendor');
      const vendorRecordObject = record.load({ type: record.Type.VENDOR, id: vendorRecordId });
      vendorRecordObject.setValue({ fieldId: 'custentity_vendorapprovalstatus', value: 2 });
      vendorRecordObject.setValue({ fieldId: 'isinactive', value: true });
      vendorRecordObject.save();

      workflow.trigger({
        recordId: vendorRecordId,
        recordType: record.Type.VENDOR,
        workflowId: 'customworkflow_vendorapproval'
      });
    } catch (e) {
      log.error('There was an unexpected error in beforeSubmit - ' + e.name, e.message);
    }
  }


  return { beforeSubmit };

});