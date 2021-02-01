var myPlayer = videojs('my_video_1');
var changeQualityTimer = 0;





// Change quality
$('#selectQuality').change(function () {
    $('.clsTempMSg').remove();
    var targetTempMsg;
    if ($('#adjustTiming') && $('#adjustTiming').length > 0) {
        targetTempMsg = $('#adjustTiming');
    } else {
        targetTempMsg = $('#centerDivVideo');
    }

    /*
    var streamUrl = $kissenc.decrypt($(this).val());
    if (streamUrl.includes('lh3.googleusercontent.com')) {
        targetTempMsg.after('<div class="clsTempMSg"><div style="font-size: 14px; font-weight: bold">If the player does not work, CLICK <a rel="noreferrer" href="' + $kissenc.decrypt($(this).val()) + '">HERE</a> to use your device\'s player</div></div>');
    } else {
        targetTempMsg.after('<div class="clsTempMSg"><div style="font-size: 14px; font-weight: bold">If the player does not work, CLICK <a href="' + $kissenc.decrypt($(this).val()) + '">HERE</a> to use your device\'s player</div></div>');
    }*/

    SetPlayer($kissenc.decrypt($(this).val()));
    changeQualityTimer++;
});
$('#selectQuality').change();

// Set player video source
function SetPlayer(code) {
    var whereYouAt = myPlayer.currentTime();
    myPlayer.src({ type: "video/mp4", src: code });
    $('#my_video_1').focus();
    if (changeQualityTimer > 0) {
        myPlayer.play();

        myPlayer.on("loadedmetadata", function () {
            myPlayer.currentTime(whereYouAt);
        });
    }
    else {
        window.scrollTo(0, 0);
    }

    var volume = getCookie("videojsVolume");
    if (volume != null && volume != "") {
        myPlayer.volume(volume);
    }
}

// Init player
myPlayer.ready(function () {
    this.hotkeys({
        volumeStep: 0.1,
        seekStep: 5,
        enableMute: true,
        enableFullscreen: true
    });

    this.progressTips();

   

 

   

    $('#my_video_1').focus();
    window.scrollTo(0, 0);
});

$('#my_video_1').focusout(function () {
    $(this).css("outline", "0px");
});

$('#my_video_1').focus(function () {
    $(this).css("outline", "#333333 solid 1px");
});

// Keep player non-stop because of failed loading
var prevTime = 0;

function updatePrevTime() {
    var curTime = myPlayer.currentTime();
    if (curTime != prevTime) {
        retryPlay = 0;
        prevTime = curTime;
    }
}

setInterval(function () { updatePrevTime(); }, 3000);

var errorCount = 0;
var retryPlay = 0;
var forceVidSrc = '';
var closeTopPageAlertTimeout = null;
myPlayer.on('error', function (e) {
    try {
		myPlayer.error(null);
        retryPlay++;
        var currTime = myPlayer.currentTime();
		var isGoogleVideo = myPlayer.src().indexOf('googlevideo.com') >= 0;
        var maxRetry = 100;
        if (isGoogleVideo) {
            maxRetry = 3;
        }
		
        if (retryPlay <= maxRetry || currTime > 0) {
            clearTimeout(closeTopPageAlertTimeout);
            $('.top_page_alert').html('Retry loading ' + retryPlay + '/' + maxRetry + '. Please wait');
            if ($('.top_page_alert').css('display', 'none')) {
                $('.top_page_alert').css('display', 'block');
                closeTopPageAlertTimeout = setTimeout(function () {
                    $('.top_page_alert').css('display', 'none');
                }, 1000);
            }

            var tempVar = '';
            if (forceVidSrc != '') {
                tempVar = forceVidSrc;
            } else {
                tempVar = $kissenc.decrypt($('#selectQuality').val());
            }

            myPlayer.src({ type: "video/mp4", src: tempVar });
            if (currTime != 0) {
                myPlayer.currentTime(currTime);
            } else {
                myPlayer.currentTime(prevTime);
            }

            myPlayer.play();
        } else {
			if (window.location.href.indexOf('&pfail') < 0 &&
				window.location.href.indexOf('&s=beta') < 0	) {
                window.location.href = window.location.href + "&s=beta&pfail=1";
            } else if (window.location.href.indexOf('&pfail') < 0) {
                window.location.href = window.location.href + "&pfail=1";
            } else {
                retryPlay = 0;
            }
        }
    } catch (ex) { }
});

myPlayer.on('click', function(e){
	$('#my_video_1').focus();
});

// Volume
myPlayer.on('volumechange', function () {
    setCookie('videojsVolume', myPlayer.volume(), 365);
});

// Subtitles
var subDelay = 0;
$('#adjustTiming .btnMinus').click(function () {
    subDelay -= 50;
    $('#adjustTiming .text').val(subDelay);
    adjustSubtitleDelay(subDelay);
});

$('#adjustTiming .btnPlus').click(function () {
    subDelay += 50;
    $('#adjustTiming .text').val(subDelay);
    adjustSubtitleDelay(subDelay);
});

var adjustSubTimer = null;
function adjustSubtitleDelay(ms) {
    if (adjustSubTimer != null) {
        clearTimeout(adjustSubTimer);
    }

    adjustSubTimer = setTimeout(function () {
        myPlayer.player().options()['trackTimeOffset'] = ms * -1 / 1000;
    }, 500);
}

function enableSyncAudioTrack(audioSrc) {
    audioSrc = $kissenc.decrypt(audioSrc);
    var myAudio = document.createElement("audio");
    myAudio.id = "my_audio_1";
    myAudio.className = "video-js";
    myAudio.setAttribute("controls", true);
    $(myAudio).css('display', 'none');
    var mySource1 = document.createElement("source");
    mySource1.id = "ka";
    mySource1.src = audioSrc;
    mySource1.type = "audio/mp4";
    myAudio.appendChild(mySource1);
    document.body.appendChild(myAudio);
    var myAudioPlayer = videojs('my_audio_1');
    myPlayer.ready(function() {
        this.on("play", function() {
            myAudioPlayer.currentTime(myPlayer.currentTime());
            myAudioPlayer.play();
        });

        this.on("timeupdate", function() {
            if (Math.abs(myAudioPlayer.currentTime() - myPlayer.currentTime()) >= 0.1) {
                myAudioPlayer.currentTime(myPlayer.currentTime());
                console.log(myAudioPlayer.currentTime() - myPlayer.currentTime());
            }
        });

        this.on("seeking", function() {
            myAudioPlayer.currentTime(myPlayer.currentTime());
        });

        this.on("pause", function() {
            myAudioPlayer.pause();
        });
    });
}
