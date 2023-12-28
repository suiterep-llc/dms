define(['SuiteScripts/Email Invoice Button/sr_emailinvoice_lib_server'], function (lib) {
    /**
     * @module moduleName this script creates a Suitelet form that lets you write and send an email
     * @NApiVersion 2.x
     * @NScriptType Suitelet
     * @author Stephen Lemp (SuiteRep LLC)
    */

    var exports = {};


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
        try {
            lib.handleSuiteletRequest(context);
        } catch (e) {
            log.error('Error in handleSuiteletRequest - ' + e.name, e.message);
            throw e;
        }
    }

    exports.onRequest = onRequest;
    return exports;
});