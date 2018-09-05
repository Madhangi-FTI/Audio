// ---------------------------------   Initialize --------------------------------- 
var useDocId, authHeader = "", redactions, corrections, language;

function doWork() {
    try {
        setupRunInfo();
        SetupEventHandlers();
        getRedactions();
        getIndexInfo();
        getRedactionSets();
        loadCaptionsStep();
        getAudioStep();
        organizeDisplay();
    }
    catch (err) {
         alert("Error occured - " + err.message);
    }
}

function setupRunInfo() {
    window.useDocId = window.bbnDocId;
    window.authHeader = 'Basic ' + window.bbnCreds;
    window.useDocId = window.bbnIsMono ? window.bbnDocId : window.bbnDocId + '-A';
}

function organizeDisplayStep() {
    showStatus("Organize display ...");
    organizeDisplay();
    showStatus("Successully organized display");
}

function getIndexInfo() {
    getAjaxData(getIndexInfoPromise, "Gather info about the index", "",
        function (data) { window.language = data.sourceTypes[0].replace("-TOK", ""); }
    );
}

// ---------------------------------   Initialize --------------------------------- 

// ---------------------------------   CAPTIONS --------------------------------- 

function formatDualCaptions(capA, capB) {
    try {
        var utt = [];
        var utt1 = null, utt2 = null;
        while (capA.utterances.length > 0 || capB.utterances.length > 0 || utt1 != null || utt2 != null) {
            if (utt1 == null && capA.utterances.length > 0) {
                utt1 = capA.utterances.shift();
            }
            if (utt2 == null && capB.utterances.length > 0) {
                utt2 = capB.utterances.shift();
                utt2.utteranceId = "Utterance-" + utt2.utteranceId + 'other';
            }
            if ((utt1 != null && utt2 != null && utt2.startTime <= utt1.startTime) ||
                 (utt1 == null && utt2 != null)) {
                utt.push(utt2);
                utt2 = null;
            }
            else if ((utt1 != null && utt2 != null && utt1.startTime <= utt2.startTime) ||
                     (utt2 == null && utt1 != null)) {
                utt.push(utt1);
                utt1 = null;
            }
        }
    }
    catch (err) {
        showStatus("Failed formating dual captions " + err.message);
        utt = [];
    }
    return utt;
}

function formatMonoCaption(capA) {
    try {
        var utt = [];
        var utt1;
        while (capA.utterances.length > 0) {
            utt1 = capA.utterances.shift();
            utt.push(utt1);
        }
    }
    catch (err) {
        showStatus("Aborted " + err.message);
        utt = [];
    }
    return utt;
}

function loadCaptionsStep() {
    if (window.bbnIsMono) {
        getAjaxData(getCaptionsPromise(""), "Gather single sided transcripts", "",
            function (data) { formatCaptionsStep(data); },
            ""
        );
    }
    else {
        getAjaxData2(getCaptionsPromise, "Gather multi sided transcripts", "",
            function (data1, data2) { formatCaptionsStep(data1, data2); }
        );
    }
}

function formatCaptionsStep(capA, capB) {
    if (window.bbnIsMono) {
        showStatus( "Format single sided audio");
        var utt = formatMonoCaption( capA);
        showStatus("Success: Format single sided audio");
    } else {
        showStatus("Format multi sided audio");
        utt = formatDualCaptions(capA, capB);
        showStatus("Success: Format multi sided audio");
    }
    renderCaptions(utt);
}

// ---------------------------------   CAPTIONS --------------------------------- 

// ---------------------------------   REDACTIONS --------------------------------- 

function getRedactions() {
    getAjaxData(getRedactionsPromise, "Gather existing redactions for this document", "",
        function (data) { window.redactions = data; renderRedactions(); }
    );
}

function addRedaction(redactionSet, startTime, endTime) {
    getAjaxData(addRedactionPromise, "Add redaction", "alert",
        function (data) { alert(data.message); location.reload(); },
        { startTime: startTime, endTime: endTime, redactionSet: redactionSet }
    );
}

function removeRedaction(redaction) {
    getAjaxData(delRedactionPromise, "Remove redaction", "alert",
        function (data) { alert(data.message); location.reload(); },
        redaction
    );
}

function isRedacted(token) {
    var i = 0;
    if (window.redactions != null)
        while (i < window.redactions.length)
            if (overlaps(token, window.redactions[i++])) return true;
    return false;
}

function overlaps(token, range) {
    token.endTime = token.startTime + token.duration;
    return (token.startTime >= range.startTime && token.startTime <= range.endTime) ||
    (token.endTime >= range.startTime && token.endTime <= range.endTime) ||
    (token.startTime <= range.startTime && token.endTime >= range.endTime);
}

// ---------------------------------   REDACTIONS --------------------------------- 

// ---------------------------------   AUDIO --------------------------------- 

function getAudioStep() {
    showStatus("Playing audio ...");
    setupJPlayer();
    showStatus("Successfully started Audio");
}

// ---------------------------------   AUDIO --------------------------------- 

// ---------------------------------   REDACTION SETS --------------------------------- 

function addRedactionSet() {
    var newSet = prompt("Enter New Redaction Set", "Enter Here...");
    if (newSet == "" || newSet == null) {
        alert("The Redaction Set cannot be empty or null!");
    }
    if ($.inArray(window.redactionSets, newSet) >= 0) {
        alert("The Redaction Set already exists!");
    }
    else {
        getAjaxData(addRedactionSetsPromise, "Add redaction set", "alert",
            function (data) { alert(data.message); location.reload(); },
            newSet
        );
    }
}

function getRedactionSets() {
    getAjaxData(getRedactionSetsPromise, "Gather redaction sets for this case", "",
        function (data) { renderRedactionSets(data); }
    );
}

// ---------------------------------   REDACTION SETS --------------------------------- 

// ---------------------------------   CORRECTIONS --------------------------------- 

function correctTranscript(correctedWord, startTime, endTime) {
    getAjaxData(correctTranscriptPromise, "Correct the transcript", "alert",
        function (data) { alert(data.message); location.reload(); },
        { startTime: startTime, endTime: endTime, correctWords: correctedWord }
    );
}

// ---------------------------------   CORRECTIONS --------------------------------- 
