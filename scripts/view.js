var ccTable, redTable, fixTable, player;
var tranDiv, tranStyle, tranBorder, tranOffset, tranHeight;
var loc = [], curHiLiteId, curElement;
var selectRSet, selectStart, selectEnd, selectText;
var isCorrection = false, cst, cdur = 0, ctok = "";

function SetupEventHandlers() {
    $('#docId').text(window.bbnDocId);

    curHiLiteId = $(), curElement = $(),
        ccTable = $("#ccTable"), redTable = $("#redTable"), fixTable = $("#fixTable"),
        player = $("#jp_player");

    setupWindowScroll();
    setupRedactionSetButtons();
}

function formatTimeForDisplay(time) {

    var totalSec = new Date(parseInt(time) * 1000) / 1000;
    var hours = parseInt(totalSec / 3600) % 24;
    var minutes = parseInt(totalSec / 60) % 60;
    var seconds = totalSec % 60;

    var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);

    if (hours == 0) result = (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    return result;
}

Element.prototype.HiLiteTranscript = function (locId) {
    curHiLiteId.removeClass("hiLite");
    $(this).addClass("hiLite");
    curHiLiteId = $(this);

    var element = this.parentNode.parentNode;
    if (element != curElement) {
        var overTop = element.offsetTop - tranDiv.scrollTop >= tranHeight - 6 /*padding...*/,
            overBottom = (tranDiv.children[0].scrollTop - tranHeight) > (element.offsetTop - (tranHeight - element.offsetTop - element.clientHeight));

        if (((element.offsetTop - element.clientHeight + 20) > (tranDiv.children[0].clientHeight + tranDiv.children[0].scrollTop)-20) || element.offsetWidth < tranDiv.children[0].scrollWidth) {
            //element.scrollIntoView(true);
            $(tranDiv.children[0]).scrollTop(element.offsetTop);
        }
        curElement = element;
    }
    return false;
}

function organizeDisplay() {
    $("#tabs-a").tabs();
    $("#tabs-b").tabs();

    document.body.style.overflow = "hidden";
    tranDiv = $("#tabs-transcript")[0],
    tranStyle = window.getComputedStyle(tranDiv, null),
    tranBorder = parseInt(tranStyle.getPropertyValue('border-top-width')),
    tranOffset = tranDiv.offsetTop,
    tranHeight = $(window).height() - tranDiv.offsetTop - 10;
    $("#tabs-transcript").height(tranHeight);
    document.body.style.overflow = "";
    $("#tabs-a").tabs("option", "active", 1);

    $(tranDiv).on('dblclick', '#ccTable tbody tr', function () {
        if ($(this.children[1]).find('span.editable input').length > 0) {
            $("#jp_player").jPlayer("pause", $("#jp_player").data("jPlayer").status.currentTime);
            return;
        }
        playAudio(parseInt($(this).attr('sTime')));
    });
}

function renderCaptions(utterances) {
    var index = 0;

    $.each(utterances, function (uttIndex, utterance) {
        var out = '<tr sTime="' + utterance.startTime + '"><td><b>' + formatTimeForDisplay(utterance.startTime) + ':</b></td><td>';
        $.each(utterance.tokens, function (tokIndex, token) {

            var tokenLabel = normalize(token, tokIndex);

            var locId = ("000000" + index).slice(-6);
            window.loc[index++] = { "startTime": token.startTime, "duration": token.duration, "locId": locId };

            out += '<span id="' + locId + '"' + getStyles(token) + '>' + tokenLabel + '</span> ';
            renderCorrections(token, tokenLabel);
        });
        out += "</td></tr>";
        ccTable.append(out);
    });

    $("#addNewRSet").click(function (e) {
        addRedactionSet();
    });

    $(".editable").click(function (e) {
        var eid = $(this).attr('id');
        selectText = $(this).text();
        $("#" + eid).editable("click", function (ie) {
            if (selectText != ie.value) {
                var vs = parseInt(eid);
                var start = window.loc[vs].startTime;
                var end = window.loc[vs].startTime + window.loc[vs].duration;

                var s = "Correcting the word " + selectText + " to " + ie.value;
                s += " from time " + start + " to time " + end;
                if (confirm(s + ". Are you sure?")) {
                    correctTranscript(ie.value, start, end);
                }
            }
        });
    })
    .mouseup(function (e) {
        if (selectStart != "") selectEnd = $(this).attr('id');
        else selectEnd = "";
    })
    .mousedown(function (e) {
        selectStart = $(this).attr('id');
        selectEnd = "";
    });
}

function getStyles(token) {
    var format = 'class="editable';
    if (token.verified) format += ' verified ';
    if (isRedacted(token)) format += ' redacted';
    format += '"';
    return format;
}

function normalize(token, tokIndex) {
    var tokenLabel = token.label.toLowerCase();
    if (tokIndex == 0) {
        tokenLabel = tokenLabel.charAt(0).toUpperCase() + tokenLabel.slice(1);
    }
    else if (tokenLabel == "i") {
        tokenLabel = "I";
    }
    return tokenLabel;
}

function renderCorrections(token, tokenLabel) {
    if (token.verified) {
        if (!isCorrection) {
            cst = token.startTime;
            isCorrection = true;
        }
        cdur += token.duration;
        ctok += " " + tokenLabel;
    } else {
        if (isCorrection) {
            renderCorrection(cst, cdur, ctok);
            isCorrection = false;
            ctok = "";
        }
    }
}



function renderRedactions_old() {
    try {
        var found = false;
        $.each(window.redactions, function (index, redaction) {
            var out = '<tr>';
            out += '<td>' + formatTimeForDisplay(redaction.startTime) + '</td>';
            out += '<td>' + formatTimeForDisplay(redaction.endTime) + '</td>';
            out += '<td>' + redaction.redactionSet + '</td>';
            out += '<td><a href="#removeRedaction" id="Redact' + index + '" text-align="center"><img alt="remove" src="images/trash.png"></a></td>';
            out += '</tr>';

            redTable.append(out);
            found = true;
        });

        if (found)
            $('a[href="#removeRedaction"]').click(function () {
                var redactId = $(this).attr('id').replace('Redact', '');
                removeRedaction(window.redactions[redactId]);
            });

    } catch (err) {
        showRedactionError("Rendering Redactions", err.message);
    }
}

function renderRedactionSets(redactionSets) {
    try {
        $.each(redactionSets, function (index, redactionSet) {
            addRedactionSetDropDown(redactionSet);
        });

        selectRSet = $($(".redactionSet")[0]).attr('id');
        $("#redactLast").button('option', 'label', 'Redact: ' + selectRSet);


        $(".redactionSet").on("click", function () {
            selectRSet = $(this).attr('id');
            $("#rsMenu").hide();
            $("#redactLast").button('option', 'label', 'Redact: ' + selectRSet);
            redactVerify();
        });

    } catch (err) {
        showRedactionError("Rendering Redaction Sets", err.message);
    }
}


function redactVerify() {
    if (selectStart != "" && selectEnd != "") {
        try {
            var vs = parseInt(selectStart);
            var ve = parseInt(selectEnd);
            var start = window.loc[vs].startTime;
            var end = window.loc[ve].startTime + window.loc[ve].duration;

            var s = "Redacting from " + start + " to " + end;
            s = s + " will be redacted with " + selectRSet + " set";
            if (confirm(s + ". Are you sure?")) {
                addRedaction(selectRSet, start, end);
            }
        } catch (ex) {
            alert("Please select the text to redact - Error occured - " + ex.message);
        }
    } else {
        alert("Please select the text to redact");
    }
}

function addRedactionSetDropDown(redactionSet) {
    var out = '<li id="' + redactionSet + '"  class="redactionSet">' + redactionSet + '</li>';
    $("#rsMenu").append(out);
}

function showTranscriptError(loc, error) {
    var out = '<tr><td><b>Error :</b></td><td>';
    out += 'Loc: ' + loc + ' Msg: ' + (error ? error : "Undefined Error") + "</td></tr>";
    ccTable.append(out);
}

function showRedactionError(loc, error) {
    var out = '<tr><td><b>Error :</b></td><td>';
    out += 'Loc: ' + loc + ' Msg: ' + (error ? error : "Undefined Error") + "</td></tr>";
    ccTable.append(out);
}

function showStatus(status) {
    $("#status-content").append(status + "<br>");
}

function handleError(err, funDesc, showAt) {
    var errText = err.status + ": " + err.statusText + " (" + err.message + ")";
    showStatus("Failure: " + funDesc);
    showAt = showAt.toLowerCase();
    if (showAt == "alert") {
        alert("Failure: " + funDesc + "\r\n" + errText);
    }
    else if (showAt == "transcript") {
        showTranscriptError("Load Captions from Audio Site", errText);
    }
    else if (showAt == "redaction") {
        showRedactionError("Rendering Redactions", errText);
    }
}
function renderRedactions() {
    try {
        var table = redTable.DataTable();

        $.each(window.redactions, function (index, redaction) {
            var s = formatTimeForDisplay(redaction.startTime);
            var e = formatTimeForDisplay(redaction.endTime);
            var r = redaction.redactionSet;
            var d = '<a href="#removeRedaction" id="Redact' + index + '" text-align="center">' +
                    '<img alt="remove" src="images/trash.png"></a>';
            table.row.add([s, e, r, d]).draw();
        });

        $('a[href="#removeRedaction"]').click(function () {
            var redactId = $(this).attr('id').replace('Redact', '');
            removeRedaction(window.redactions[redactId]);
        });

    } catch (err) {
        showRedactionError("Rendering Redactions", err.message);
    }
}

function renderCorrection(startTime, duration, correctedWord) {
    try {
        var table = fixTable.DataTable();
        var endTime = startTime + duration;
        //var out = '<tr>';
        //out += '<td>' + formatTimeForDisplay(startTime) + '</td>';
        //out += '<td>' + formatTimeForDisplay(endTime) + '</td>';
        //out += '<td>' + duration.toFixed(2) + '</td>';
        //out += '<td>' + correctedWord + '</td>';
        //out += '</tr>';
        //fixTable.append(out);
        var s = formatTimeForDisplay(startTime);
        var e = formatTimeForDisplay(endTime);
        var r = duration.toFixed(2);
        var d = correctedWord;
        table.row.add([s, e, r, d]).draw();
    } catch (err) {
        showRedactionError("Rendering Redactions", err.message);
    }
}

function setupJPlayer() {
    player.jPlayer({
        timeupdate: function (event) {
            var time = event.jPlayer.status.currentTime;
            player.jPlayer('mute', isMuted(time));
            highlightCurrent(time);
        },
        supplied: "m4a",
        wmode: "window",
        smoothPlayBar: true,
        keyEnabled: true,
        remainingDuration: false,
        toggleDuration: true
    });

    var url = getAudioUrl();
    player.jPlayer("setMedia", { m4a: url });
}

function playAudio(time) {
    player.jPlayer('play', time);
}

function highlightCurrent(curTime) {
    $.each(window.loc, function (key, loc) {
        if (curTime < loc.startTime) return false;
        if (curTime >= loc.startTime && curTime <= loc.startTime + loc.duration)
            return $("#" + loc.locId)[0].HiLiteTranscript();
        return true;
    });
}

function isMuted(curTime) {
    var muted = false;
    var preempt = .5;
    var muteTime = curTime + preempt; // Look ahead "preempt" second(s) to make sure muting is done on time
    if (window.redactions) {
        $.each(window.redactions, function (index, redaction) {
            if (muteTime >= redaction.startTime && curTime <= redaction.endTime) {
                muted = true;
                return false;
            }
            
            return true;
        });
    }
    return muted;
}

function setupRedactionSetButtons() {
    $("#redactLast").click(function () { redactVerify(); });
    $("#redactLast").button();

    $("#selectRSet").button({ text: false, icons: { primary: "ui-icon-triangle-1-s" } });
    $("#selectRSet").click(function () {
        var menu = $("#rsMenu").show().position({ my: "left top", at: "left top", of: this });
        $(document).one("click", function () { menu.hide(); });
        return false;
    });

    $("#rsMenu").hide().menu();
    $("#rsButtons").buttonset();
}

function setupWindowScroll() {
    $(window).resize(function () {
        document.body.style.overflow = "hidden";
        tranHeight = $(window).height() - tranOffset - 15;
        $("#transcript-content").height(tranHeight);
        document.body.style.overflow = "";
    });

    $('#tabs-transcript').scroll(function () { curElement = $(); });
}