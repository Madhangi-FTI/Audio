function getAjaxData(promise, funDesc, showAt, successFun, params) {
    showStatus(funDesc + " ...");
    var runPromise = params == "" ? promise : promise( params);
    $.when(runPromise).then(function (data) {
        showStatus("Success : " + funDesc);
        successFun(data);
    }).fail(function (err) {
        handleError(err, funDesc, showAt);
    });
}

function getAjaxData2(promise, funDesc, showAt, successFun) {
    showStatus(funDesc + " ...");
    var runPromise1 = promise("A");
    var runPromise2 = promise("B");
    $.when(runPromise1, runPromise2).then(function (data1, data2) {
        showStatus("Success : " + funDesc);
        successFun(data1[0], data2[0]);
    }).fail(function (err) {
        handleError(err, successFun, showAt);
    });
}

function addRedactionPromise(redaction) {
    //{startTime: 9, endTime: 12, redactionSet: "DEFAULT"}
    var url = window.bbnCaseUrl + 'documents/' + window.bbnIndex + "/" + window.useDocId + "/redactions";

    return $.ajax({
        type: 'POST',
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'Authorization': window.authHeader },
        crossDomain: true,
        data: JSON.stringify(redaction),
        async: true
    });
}

function getRedactionsPromise() {

    var url = window.bbnCaseUrl + 'documents/' + window.bbnIndex + "/" + window.useDocId + "/redactions";

    return $.ajax({
        type: 'GET',
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'Authorization': window.authHeader },
        crossDomain: true,
        async: true
    });
}

function getRedactionSetsPromise() {

    var url = window.bbnCaseUrl + 'indexes/' + window.bbnIndex + "/redactionSets";

    return $.ajax({
        type: 'GET',
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'Authorization': window.authHeader },
        crossDomain: true,
        async: true
    });
}

function addRedactionSetsPromise(newSet) {

    var url = window.bbnCaseUrl + 'indexes/' + window.bbnIndex + "/redactionSets";

    return $.ajax({
        type: 'POST',
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'Authorization': window.authHeader },
        data: newSet,
        crossDomain: true,
        async: true
    });
}

function delRedactionPromise(redaction) {

    var url = window.bbnCaseUrl + 'documents/' + window.bbnIndex + "/" + window.useDocId + "/redactions";

    return $.ajax({
        type: 'DELETE',
        url: url + '?' + $.param({ "endTime": redaction.endTime, "redactionSet": redaction.redactionSet, "startTime": redaction.startTime }),
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'Authorization': window.authHeader },
        crossDomain: true,
        async: true
    });
}

function getCaptionsPromise( side) {

    var url = window.bbnCaseUrl + 'transcripts/' + window.bbnIndex + "/" + window.bbnDocId + (side == "" ? "" : "-" + side);

    return $.ajax({
        type: 'POST',
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'Authorization': window.authHeader },
        crossDomain: true,
        data: '[]',
        async: true
    });
}

function getAudioUrl() {

    return window.bbnCaseUrl + 'audio/' + window.bbnIndex + "/" + window.useDocId;
}

function getIndexInfoPromise() {

    var url = window.bbnCaseUrl + 'indexes/' + window.bbnIndex;

    return $.ajax({
        type: 'GET',
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'Authorization': window.authHeader },
        crossDomain: true,
        async: true
    });
}

function correctTranscriptPromise( correction) {

    var url = window.bbnCaseUrl + 'transcripts/' + window.bbnIndex + "/" + window.useDocId +
        '/correction?language=' + window.language;

    return $.ajax({
        type: 'POST',
        url: url,
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'Authorization': window.authHeader },
        crossDomain: true,
        data: JSON.stringify( correction),
        async: true
    });
}
