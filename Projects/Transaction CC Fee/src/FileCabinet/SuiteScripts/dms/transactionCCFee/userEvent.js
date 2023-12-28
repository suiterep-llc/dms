/**
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Stephen Lemp (SuiteRep)
 */
define(['N/query'], function (query) {

  /**
   *
   * @param {Object} context
   * @param {Record} context.newRecord  Record as submitted to server
   * @param {String} context.type  The type of UE with which the record is being accessed (create, copy, edit)
   * @return {void}
   */
  function beforeSubmit(context) {

  }

  return { beforeSubmit };
});
