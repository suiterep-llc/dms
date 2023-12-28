define([], function () {
    'use strict';
    /**
     * @description This changes the form to the PAM invoice when the division is changed.
     *
     * @deployment Invoice
     * @NApiVersion 2.1
     * @NScriptType ClientScript
     * @author Melchi Dulcio (SuiteRep)
     * @module /dms/pam/syncFormWithDivision
     */

    /**
     * 
     * @param {*} context 
     */

    function fieldChanged(context) {
        const { currentRecord, fieldId } = context;

        if (fieldId == "department" && currentRecord.getValue(fieldId) == 17 && currentRecord.getValue("customform") != 206) { //PAM
            currentRecord.setValue("customform", 206);
        }
    }

    function pageInit(context) {
        const { currentRecord } = context;
        if (currentRecord.getValue("customform") == 206 && currentRecord.getValue("department") != 17) {
            currentRecord.setValue("department", 17);
        }
    }
    return { fieldChanged, pageInit };
});