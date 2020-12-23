/* global $, LibJitsiMeetJS */

var subdomain = "meet.puneetsethi.com";
var isLocalEnv = false;
var OS = setOS();
var browserName = setBrowser();
function setBrowser() {
    if (navigator.userAgent.match('CriOS')) {
        return 'chrome';
    } else if (is_Safari()) {
        return 'safari';
    } else if (is_Firefox) {
        return 'firefox';
    } else {
        return 'other';
    }
}

function setOS() {
    var userAgent = navigator.userAgent;
    OS = 'other';
    if (userAgent.match(/Android/i)) {
        OS = 'android';
    } else if (userAgent.match(/iP(ad|hone|od)/i)) {
        OS = 'ios';
    } else if (userAgent.match(/Mac(intosh| OS X)/i)) {
        OS = 'macos';
    } else if (userAgent.match(/Windows/i)) {
        OS = 'windows';
    }
    return OS;
}

/*
Returns (true/false) whether device agent is iOS Safari
*/
function is_Safari() {
    var ua = navigator.userAgent;
    var webkitUa = !!ua.match(/WebKit/i);
    return typeof webkitUa !== 'undefined' && webkitUa && !ua.match(/CriOS/i) && !ua.match(/FxiOS/i);
}

function is_Firefox() {
    var ua = navigator.userAgent;
    var webkitUa = !!ua.match(/WebKit/i);
    return typeof webkitUa !== 'undefined' && webkitUa && !ua.match(/CriOS/i);
}

const options = {
    hosts: {
        domain: subdomain,
        muc: 'conference.' + subdomain,
    },
    enableP2P: true,
    p2p: {
        enabled: true,
        preferH264: true,
        disableH264: true,
        useStunTurn: true,
    },
    useStunTurn: true,
    serviceUrl: 'https://' + subdomain + '/http-bind',
    clientNode: 'http://jitsi.org/jitsimeet'
};

const initOptions = {};
const confOptions = {
    openBridgeChannel: true,
    useStunTurn: false
};
var postData = {};
var localDisplayName;
var password;
var session = {};
var context = {};
var roomDisplayName = "";
var sessionDuration = {};
var rejoinTimer;
var gravatar = 'https:/gravatar.com/avatar/abc123';
var connection = null;
var isJoined = false;
var isModerator = false;
var room = null;
var token;
var trainerTracks = {};
var trainerId;
var localTracks = [];
var attached = {};
var chatCounter = 0;
var memCounter = 0;
var remoteTracks = {};
var resp = {
    data: {
        aud: "meet.puneetsethi.com",
        iss: "fa34ac7e2988fcfa2d117132fefa56c4",
        sub: "meet.puneetsethi.com",
        room: "testroom",
        meeting: "testroom",
        context: {
            user: {
                avatar: "https:/gravatar.com/avatar/abc123",
                name: "John Doe",
                email: "jdoe@example.com",
                id: "abcd:a1b2c3-d4e5f6-0abc1-23de-abcdef01fedcba"
            },
            group: "a123-123-456-789"
        }
    }
};
var jitsiParticipants = {};
document.title = `Welcome to Punjabistudios Live`

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);
$('#hangoutBtn').css({ background: "#736e6e", cursor: "default" });
$('#hangoutBtn').text("Start");
$('#sessionTitle').text("Start or Join a Session");

//local tracks events
function muteLocalAudio(value) {

    value == 'on' ? localTracks[0].unmute() : localTracks[0].mute();
}

function muteLocalVideo(value) {
    value == 'on' ? localTracks[1].unmute() : localTracks[1].mute();
    if (value == 'off') {
        response.type == 'customer' ? $('#video-me').hide() : $('#video-me-trainer').hide();
    } else {
        response.type == 'customer' ? $('#video-me').show() : $('#video-me-trainer').show();
    }

}

function localTrackAudioLevelChanged(audioLevel) {
    // console.log("local Audio level changed ", audioLevel)
}

function localTrackMuteChanged(track) {

    if (!track.isLocal()) {
        console.log(track.isLocal());
        return;
    }
    console.log(`${track.getType()} - ${track.isMuted()}`)
    if (track.getType() == 'audio') {
        if (track.isMuted()) {
            $(`.mute-aud-${track.getParticipantId()}`).addClass('icon-cross');
        } else {
            $(`.mute-aud-${track.getParticipantId()}`).removeClass('icon-cross');
        }
    } else {
        $(`#video-${track.getParticipantId()}`).remove();
    }
    if (!isJoined) {
        $(`#${track.getType() === 'audio' ? 'microphone' : 'video'}`).prop('checked', !track.isMuted());
    } else {
        if (track.getParticipantId() == room.myUserId()) {
            $(`#${track.getType() === 'audio' ? 'microphone' : 'video'}`).prop('checked', !track.isMuted());
        }
    }
}

function localTrackStopped(audioLevel) {
    console.log(audioLevel)
}
function localTrackAudioInputChanged(deviceId) {
    console.log(`track audio output device was changed to ${deviceId}`)

}
function scrollToBottom() {
    var chatOuter = $("#chatMsgArea").height();
    $(".lt-scroll").scrollTop(chatOuter) + " px";
}


//remote tracks events
function remoteTrackAudioLevelChanged(audioLevel) {
    // console.log(`remote Audio Level remote: ${audioLevel}`)
}
function remoteTrackMuteChanged(remoteTrack) {
    let particip;
    if (room.participants.hasOwnProperty(remoteTrack.ownerEndpointId) && room.participants[remoteTrack.ownerEndpointId]) {
        particip = room.participants[remoteTrack.ownerEndpointId];
        if (remoteTrack.ownerEndpointId == room.myUserId()) {
            if (remoteTrack.getType() == 'audio') {
                if (remoteTrack.isMuted()) {
                    $('#microphone').prop('checked', !remoteTrack.isMuted());
                    showAlert('info', 'You have been muted by the Trainer');
                }
            }
        } else {
            if (remoteTrack.getType() == 'audio') {
                if (remoteTrack.isMuted()) {
                    $(`.mute-aud-${remoteTrack.ownerEndpointId}`).addClass('icon-cross');
                } else {
                    $(`.mute-aud-${remoteTrack.ownerEndpointId}`).removeClass('icon-cross');
                }
            } else {
                if (remoteTrack.isMuted()) {
                    if (particip._identity.group == 'trainer') {
                        $(`#video-${remoteTrack.ownerEndpointId}`).hide();
                    } else {
                        $(`#video${remoteTrack.ownerEndpointId}`).hide();
                    }
                } else {
                    if (particip._identity.group == 'trainer') {
                        $(`#video-${remoteTrack.ownerEndpointId}`).show();
                    } else {
                        $(`#video${remoteTrack.ownerEndpointId}`).show();
                    }
                }
            }
        }
    }
}

function remoteTrackStopped(audioLevel) {

    console.log('remote track stoped', audioLevel)

}
function remoteTrackAudioInputChanged(deviceId) {

    console.log(`track audio output device was changed to ${deviceId}`)

}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    $('#sessionTitle').html(`<div class="d-flex align-items-center"><span class="spinner-border text-primary spinner-border-lg" role="status" aria-hidden="false"></span>&nbsp&nbsp&nbspFetching Participants...</div>`)
    if (track.isLocal()) {
        $('#sessionTitle').html(`<div class="d-flex align-items-center">&nbsp&nbsp&nbsp${roomDisplayName}</div>`)
        console.log(track.isLocal());
        return;
    }
    var participant = track.getParticipantId();
    if (!attached[participant]) {
        attached[participant] = [];
    }
    var user = room.participants[participant];
    var userIdentity = user._identity;
    var role = user.getRole();
    var displayName = user.getDisplayName();
    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
        jitsiParticipants[participant] = {};
    }
    remoteTracks[participant].push(track);
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, (audioLevel) => remoteTrackAudioLevelChanged(audioLevel, role));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, (data) => remoteTrackMuteChanged(data, role));
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, (data) => remoteTrackStopped(data, role));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, (deviceId) => remoteTrackAudioInputChanged(deviceId, role));
    if (userIdentity.group == 'trainer') {
        var lastName = displayName.indexOf(' ') + 1;
        var initals = displayName.charAt(0) + displayName.charAt(lastName);
        $('#trainerName').text(initals);
        document.getElementById('trainerName').innerHTML = initals;
        trainerId = participant;
        // only trainer should be host
        if (room.isModerator()) {
            room.pinParticipant(participant)
            room.grantOwner(participant);
        }
        if (track.getType() == 'video') {
            trainerTracks.video = track;
            if ($(`#video-me-trainer`).length <= 0) {
                if ($(`#video-${participant}`).length <= 0) {
                    if ($('#mainArena').has('video').length > 0) {
                        $('#mainArena').find('video').remove();
                    }
                    $('#mainArena').append(`<video class="coach-vid" autoplay playsinline id='video-${participant}' />`);
                }
            }
            track.attach($(`#video-${participant}`)[0])
        } else {
            trainerTracks.audio = track;
            if ($(`#audio-me-trainer`).length <= 0) {
                if ($(`#audio-${participant}`).length <= 0) {
                    if ($('#mainArena').has('audio').length > 0) {
                        $('#mainArena').find('audio').remove();
                    }
                    $('#mainArena').append(`<audio class="coach-aud" autoplay playsinline id='audio-${participant}' />`);
                }
            }
            track.attach($(`#audio-${participant}`)[0])
        }
        $('#localName').text(displayName ? `${displayName} (Host)` : "Punjabistudios Host");
    } else {
        if ($(`#member-${participant}`).length <= 0) {
            var initals = displayName.charAt(0) + displayName.charAt(displayName.indexOf(' ') + 1);
            var actionIcons = `
                <i class="icon-microphone mute-aud-${participant}" onClick="muteParticipantAudio('${participant}')" style="cursor:pointer" tooltip" data-tooltip="Mute Microphone"></i>
                <i class="icon-eye tooltip" id="mute-vid-${participant}" onClick="muteParticipantVideo('${participant}')" data-tooltip="Hide Video"></i>
                <i class="icon-zoom tooltip scale-video-user" onClick="toggleVideo('${participant}')" data-tooltip="Full Screen"></i>`;
            if (room.isModerator()) {
                actionIcons += `<i class="fa fa-sign-out" aria-hidden="true" onClick="kickOut('${participant}')" data-tooltip="Kick out" title="Kick out">➥</i>`;
            }
            $('.video-members').append(`
            <div id="member-${participant}" class="member-video" >
                <div class="trainer-profile-circle">
                    <div class="circle">
                        <span id="memberName">${initals}</span>
                    </div>
                </div>
                <div class="member-wrap-video" id="member-area-${participant}" >
                    <div class="video-info">
                        <div class="name" id="mem-${participant}">${displayName ? displayName : "Punjabistudios user"}</div>
                        <div class="actions">
                            ${actionIcons}
                        </div>
                    </div>
                </div>
            </div>`);
            if (track.getType() == 'video') {
                var title = userIdentity.group == 'trainer' ? 'Coach ' : "";
                showAlert('success', `${title}${jitsiParticipants[participant].getDisplayName()} has joined`, 'Success!');
            }
        }
        if (!attached[participant].includes(track.getType())) {
            $('#member-area-' + participant).prepend(`<${track.getType()} autoplay playsinline id='${track.getType()}${participant}' />`);
            attached[participant].push(`${track.getType()}`);
        }
        track.attach($(`#${track.getType()}${participant}`)[0]);
    }
    $('#sessionTitle').html(`<div class="d-flex align-items-center">&nbsp&nbsp&nbsp${roomDisplayName}</div>`);
    app.gridVideo();
}

function showAlert(type = 'info', message = "", heading = 'Info', fade = true) {
    var id = Math.floor(Math.random() * Math.floor(9999));
    $(".alerts-wrap").append(`<div class="alert alert-${type} alert-dismissible" id="alert-${id}" >
        <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
        <strong>${heading}</strong> ${message}
        </div>`);
    if (fade) {
        $(`#alert-${id}`).fadeOut(7000);
    }
}


function setShortName(name, type = 'trainer') {
    var lastName = name.indexOf(' ') + 1;
    if (type == 'trainer') {
        $('#trainerName').text(name.charAt(0) + name.charAt(lastName));
    } else {
        $('#memberName').text(name.charAt(0) + name.charAt(lastName));
    }
}

function kickOut(participant) {
    if (room.isModerator()) {
        var participName = room.getParticipantById(participant).getDisplayName();
        if (confirm(`Are you sure you want to Remove ${participName} from the Session?`)) {
            room.kickParticipant(participant);
        } else {
            console.log(`Not removing ${participName}`);
        }
    }
}

function toggleVideo(participant) {
    var content = $('#content');
    content.removeClass('full-all-members');
    $('#content').toggleClass('full-screen-member');
    $($(`#member-${participant}`)).closest('.member-video').toggleClass('full-active');
    if ($('.full-screen-member').length) {
        $('.video-list .member-video.video-trainer').prependTo($('.video-main'));
    }
}


/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
    localTracks = tracks;
    // $('#localName').text(localDisplayName);
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, (audioLevel) => localTrackAudioLevelChanged(audioLevel));
        localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, (data) => localTrackMuteChanged(data));
        localTracks[i].addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, (data) => localTrackStopped(data));
        localTracks[i].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, (deviceId) => localTrackAudioInputChanged(deviceId));
        if (localTracks[i].getType() === 'video') {
            room;
            // $('#mainArena').prepend(`<video autoplay='1' id='video-me' />`);
            if (response.type == 'trainer') {
                $('#mainArena').prepend(`<video autoplay playsinline id='video-me-trainer' />`);
                localTracks[i].attach($(`#video-me-trainer`)[0]);
            } else {
                $('#vidListMe').prepend(`<video autoplay playsinline id='video-me' />`);
                localTracks[i].attach($(`#video-me`)[0]);
            }
            $('#video').prop('checked', !localTracks[i].isMuted());
        } else {
            // $('#mainArena').prepend(`<audio autoplay='1' muted='true' id='audio-me' />`);
            if (response.type == 'trainer') {
                $('#mainArena').prepend(`<audio autoplay='1' muted='true' id='audio-me-trainer' />`);
                localTracks[i].attach($(`#audio-me-trainer`)[0]);
            } else {
                $('#vidListMe').prepend(`<audio autoplay='1' muted='true' id='audio-me' />`);
                localTracks[i].attach($(`#audio-me`)[0]);
            }
            $('#microphone').prop('checked', !localTracks[i].isMuted());
        }
        if (isJoined) {
            room.addTrack(localTracks[i]);
        }
    }
    document.getElementById('microphone').addEventListener('change', ($event) => muteLocalAudio($event.target.checked ? 'on' : 'off'), false);
    document.getElementById('video').addEventListener('change', ($event) => muteLocalVideo($event.target.checked ? 'on' : 'off'), false);
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    $('.toast').toast('show');
    $('#sessionTitle').html(`<div class="d-flex align-items-center">&nbsp&nbsp&nbsp${roomDisplayName}</div>`)
    isJoined = true;
    for (let i = 0; i < localTracks.length; i++) {
        room.addTrack(localTracks[i]);
    }
    document.title = roomDisplayName;
    $('body').on('click', '#hangoutBtn', endSession);
    // $('#sessionTitle').text(session.name + ':');
    $('#hangoutBtn').css({ background: "#FF525A", cursor: "pointer" });
}

/**
 *
 * @param id
 */
function onUserLeft(id, user) {
    if (memCounter > 0) {
        memCounter--;
        document.getElementById('member-counter').innerHTML = memCounter;
    }
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];
    if ($('#user-' + id).length > 0) {
        $('#user-' + id)[0].remove();
    }
    for (let i = 0; i < tracks.length; i++) {
        tracks[i].dispose().then((response) => {
            tracks[i].detach($(`#${tracks[i].getType()}${id}`)[0]);
            if ($(`#${tracks[i].getType()}${id}`).length > 0) {
                $(`#${tracks[i].getType()}${id}`)[0].remove();
            }
            if (attached[id]) {
                var index = attached[id].indexOf(tracks[i].getType());
                if (index >= 0) { attached[id].splice(index, 1); }
            }
        })
    }
    $(`#member-${id}`).remove();
    $(`#member-area-${id}`).remove();
    delete remoteTracks[id];
    delete jitsiParticipants[id];
    $(`#video-${id}`).remove();
    $(`#audio-${id}`).remove();
    if (user.isModerator()) {
        endSession('hostEndedSession');
    }
}

/**
 * That function is called when connection is established successfully
 */
function onUserJoined(id, jitsiParticipant) {
    remoteTracks[id] = [];
    jitsiParticipants[id] = jitsiParticipant;
    showAlert('success', `${jitsiParticipant.getDisplayName()} joined ${roomDisplayName}`, 'Success');
    memCounter++;
    document.getElementById("member-counter").style.display = "flex";
    document.getElementById('member-counter').innerHTML = memCounter;
    addParticipant(id);
}

function addParticipant(id) {
    var participant = jitsiParticipants[id];
    var partic_name = participant._identity.group == 'trainer' ? `${participant.getDisplayName()} (Trainer)` : participant.getDisplayName();
    // only add if the element is not in the lists

    let avatar = false;
    var lastindex = partic_name.indexOf(' ') + 1;
    var initials = partic_name.charAt(0) + partic_name.charAt(lastindex);
    var html = `<div class="circle" style="padding:11px 10px;"><span style="color: #fff;" id="trainerName">${initials}</span></div>`;
    if (participant._identity.user.avatar) {
        avatar = participant._identity.user.avatar;
        html = `<img src="${avatar}" alt=""></img>`
    }
    if ($(`#user-${id}`).length <= 0) {
        var actionIconsSidnav = `
        <i class="icon-microphone tooltip mute-aud-${id}" onClick="muteParticipantAudio('${id}')" data-tooltip="Mute Microphone"></i>
        <i class="icon-eye tooltip" id="side-eye-${id}" data-tooltip="Hide Video" onClick="muteParticipantVideo('${id}')"></i>`;
        if (room.isModerator() && context.group == 'trainer') {
            actionIconsSidnav += `<i class="fa fa-sign-out" aria-hidden="true" onClick="kickOut('${id}')" data-tooltip="Kick out" title="Kick out">➥</i>`;
        }
        $('#user-list-panel').append(`
            <div id="user-${id}" class="user">
                <div class="user-info">
                    <div class="user-img" style="background-color: #1298D4;">
                        ${html}
                    </div>
                    <div class="user-name">
                        ${partic_name}
                    </div>
                </div>
                <div class="actions">
                    ${actionIconsSidnav}
                </div>
            </div>`);
    }
}

function toggleIcons() {
    var content = $('#content');
    $('.video-main .scale-video').on('click', function () {
        if (content.hasClass('full-screen-me') || $('.member-view .content').hasClass('full-screen-member')) {
            content.removeClass('full-screen-me');
            $('.video-main .member-video.me').prependTo($('.video-members'));
            $('.video-list .member-video.video-trainer').removeClass('full-active').prependTo($('.video-main'))
        } else {
            content.removeClass('full-screen-member');
            if (window.innerWidth < 767) {
                content.toggleClass('full-screen-trainer');
            }
        }
        if ($('.member-view .content').hasClass('full-screen-member')) {
            content.removeClass('full-screen-member');
            $('.video-list .member-video').removeClass('full-active');
            $('.video-main .member-video.me').prependTo($('.video-members'));
            $('.video-list .member-video.video-trainer').removeClass('full-active').prependTo($('.video-main'))
        }
        // }
    });
    $('.scale-video-trainer, .trainer-view  .member-video.video-trainer .icon-zoom').on('click', function () {
        // if (window.innerWidth > 992) {
        content.removeClass('full-screen-member');
        content.toggleClass('full-all-members');
        if ($('.content.full-all-members').length) {
            $('.video-main .member-video').prependTo($('.video-list .video-members'));
        } else {
            $('.video-list .member-video.video-trainer').prependTo($('.video-main'))
        }
        app.gridVideo();
        // }
    });
    $('.member-video:not(.video-trainer):not(.me) .icon-zoom').on('click', function () {
        // if (window.innerWidth > 992) {
        content.removeClass('full-all-members');
        $('#content').toggleClass('full-screen-member');
        $(this).closest('.member-video').toggleClass('full-active');
        if ($('.full-screen-member').length) {
            $('.video-list .member-video.video-trainer').prependTo($('.video-main'));
        }
        // }
    });
    $('.member-view .member-video.me').on('click', function () {
        // if (window.innerWidth > 992) {
        $('#content').toggleClass('full-screen-me');
        if ($('.full-screen-me').length) {
            $('.video-main .member-video.video-trainer').addClass('full-active').prependTo($('.video-list .video-members'));
            $('.video-list .member-video.me').prependTo($('.video-main'));
        }
        // }
    });

}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess(session) {
    showLoader("Connected", true);
    $('body').off('click', '#hangoutBtn', endSession);
    var text = isModerator ? 'Creating Room' : 'Joining Room';
    $('#sessionTitle').html(`<div class="d-flex align-items-center"><span class="spinner-border text-primary spinner-border-lg" role="status" aria-hidden="false"></span>&nbsp&nbsp&nbsp${text}...</div>`)
    joinRoom(session);
}

function validateSession(name) {
    if (!name) return false;
    return !/[~`!@#$%\^&*+=\(\)\-\[\]\\';,/{}|\\":<>\?]/g.test(name);
}

function submitRoomDetails() {
    event.preventDefault();
    var sessionName = $("input[name=sessionName]").val().toLowerCase().replace(/ /g, '');
    if (!sessionName || sessionName === "") {
        $("input[name=sessionName]").addClass('is-invalid');
        return;
    } else {
        session.name = sessionName;
        $("input[name=sessionName]").removeClass('is-invalid');
    }

    if ($("input[name=sessionPassword]").val()) {
        session.password = $("input[name=sessionName]").val();
    }
    $('#createSessionForm').modal('hide');
    joinRoom(session);
}

function muteParticipantAudio(id) {

    if (room.isModerator() && response.type == 'trainer') { //TOTO ASAP remove this check and roomJID identity as trainer
        $(`.mute-aud-${id}`).toggleClass('icon-cross');
        room.muteParticipant(id);
    } else {
        console.log("you are not admin")
    }
}

function muteParticipantVideo(id) {
    // if (isModerator) {
    //     room.muteParticipant(id);
    // }
    // console.log("you are not admin")
    hideVideo(id);
    app.gridVideo();
}


function hideVideo(id) {

    $("#member-" + id).toggleClass('hide');
    $("#side-eye-" + id).toggleClass('icon-cross');
    // $("#member-" + id).closest('.member-video').show();

    // var user = $("#mute-vid-"+id).closest('.user');
    // if (user) {
    //     // var id = user.attr('id').replace('user-', '');
    //     var video = $('#member-' + id);
    //     video.find('.icon-cross').removeClass('icon-cross');
    //     video.slideToggle();
    // }
    // var member = $("#mute-vid-"+id).closest('.member-video');
    // if (member.length) {
    //     var id = member.attr('id').replace('member-', '');
    //     $('#user-' + id).find('.icon-eye').addClass('icon-cross');
    // }
}

function endSession(modal = 'thankyou') {
    if (room && room.isJoined()) {
        room.leave();
    }
    isModerator = false;
    session = {};
    connection = null;
    isJoined = false;
    room = null;
    token;
    attached = {};
    chatCounter = 0;
    remoteTracks = {};
    jitsiParticipants = {};
    $('#meet-recorder').remove();
    $('#meet-sharer').remove();
    $('#hangoutBtn').css({ background: "#736e6e", cursor: "default" });
    if (modal == 'hostEndedSession') {
        $(`#hostEndedSession`).modal("show");
    } else {
        $(`#${modal}`).modal("show");
    }
    $('#hangoutBtn').text("Create Session");
}

function makeOwner(id) {
    room.grantOwner(id);
}

function onConferenceLeft() {
    $('#hangoutBtn').css({ background: "#736e6e", cursor: "default" });
    $('#hangoutBtn').css({ background: "#736e6e", cursor: "default" });
    $('#sessionTitle').text(`Start or Join a session`);
    $('#sessionTime').text("");
    clearInterval(sessionTime);
    muteLocalAudio('off');
    muteLocalVideo('off')
    clearCounter();
    clearValues();
    removeListenrs();
    window.location = `${window.location.origin}#thankyou`;
    document.title = `Welcome to Punjabistudios Live`;
}

function onEndPointMessageReceived(data, d, s) {
}

function onMessageReceived(id, string, ts) {
    sender = room.getParticipantById(id);
    var message = JSON.parse(string);
    var displayName = message.from;
    var text = message.message;
    if (sender) {
        displayName = sender.getDisplayName();
    }
    var lastindex = displayName.indexOf(' ') + 1;
    var initials = displayName.charAt(0) + displayName.charAt(lastindex);
    if (room.myUserId() == id) {
        $('#chatMsgArea').append(`<div class="chat-message right"><div class="message-text">${text}</div></div>`);
        scrollToBottom();
    } else {
        chatCounter++;
        document.title = `(${chatCounter}) ${roomDisplayName}`;
        document.getElementById("chat-counter").style.display = "flex"; // to hide
        document.getElementById('chat-counter').innerHTML = chatCounter;
        let avatar = false;
        var html = `<div class="author-img" style="background-color: #1298D4;width: 40px;height: 40px;border-radius: 50%;text-align: center;color: white;padding: 12px 10px;"><span id="memberName">${initials}</span></div>`;
        if (sender && sender._identity.user.avatar) {
            avatar = sender._identity.user.avatar;

            if (avatar) {
                html = `<div class="author-img" style="background-color: #1298D4;"><img src="${avatar}" alt=""></img></div>`;
            }
        }
        $('#chatMsgArea').append(`
            <div class="chat-message">
                <div class="author">
                    ${html}
                    <div class="author-info">
                        <div class="name">${displayName}</div>
                        <div class="date">${moment(ts).format('LT')}</div>
                    </div>
                </div>
                <div class="message-text">${text}</div>
            </div>`);
        scrollToBottom();
    }
}

function clearCounter() {
    chatCounter = 0;
    document.title = roomDisplayName;
}

function removeListenrs() {
    $('body').off('click', '#hangoutBtn', endSession);
}

function clearValues() {
    chatCounter = 0;
    localStorage.removeItem('punjabistudios');
    document.title = 'Punjabistudios';
    $('#chatMsgArea').innerHTML = "";
    $('#user-list-panel').innerHTML = "";
    document.getElementById("chat-counter").style.display = "none"; // to hide
    document.querySelectorAll('.chat-message').forEach((a) => a.remove())
}

function connectionRestored(id) {
    console.log("CONNECTION_RESTORED", id);
    ;
}
function participantKickedOut(data) {
    console.log("participantKickedOut", data);
    ;
}
function kickedOut(data) {
    console.log("KICKED", data);
    ;
}
function connectionInterrupted(id) {
    console.log("CONNECTION_INTERRUPTED", id);
}
function conferenceFailed(data) {
    debugger
    console.log("CONFERENCE_FAILED", data);
    startRejoinTimer(10);
}

function conferenceError(data) {
    debugger
    console.log("CONFERENCE_ERROR", data);
    startRejoinTimer(10);
}

function rejoin(event) {
    location.reload();
}

function conferenceCreatedTimeStamp(timestamp) {
    startTimer(0);
}

function startRejoinTimer(duration) {
    $('#rejoining').modal('show');
    var i = duration;
    rejoinTimer = setInterval(function () {
        i--;
        $('#rejoiningTimer').text(i);
        if (i <= 0) {
            clearRejoinTimer();
        }
    }, 1000);
}

function clearRejoinTimer(event = false) {
    clearInterval(rejoinTimer);
    location.reload();
}

function __startTimer(duration) {
    var timer = duration, minutes, seconds;
    sessionTime = setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);
        if (seconds > 60) {
            seconds = "00"
        }
        if (minutes > 60) {
            minutes = "0"
        }
        $('#sessionTime').text(minutes + ":" + seconds)
        timer++;
    }, 1000);
}

function startTimer(duration = 0) {
    var minutesLabel = document.getElementById("sessionTimeMinutes");
    var secondsLabel = document.getElementById("sessionTimeSeconds");
    var totalSeconds = duration;
    sessionTime = setInterval(setTime, 1000);
    function setTime() {
        ++totalSeconds;
        secondsLabel.innerHTML = pad(totalSeconds % 60);
        minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
    }

    function pad(val) {
        var valString = val + "";
        if (valString.length < 2) {
            return "0" + valString;
        } else {
            return valString;
        }
    }
}

function joinRoom(s) {
    room = connection.initJitsiConference(s.room, confOptions);
    room.setDisplayName(s.name);
    if (response.type == 'trainer') {
        room.grantOwner(room.myUserId());
    }
    room.on(JitsiMeetJS.events.conference.CONFERENCE_CREATED_TIMESTAMP, conferenceCreatedTimeStamp);
    room.on(JitsiMeetJS.events.conference.CONNECTION_INTERRUPTED, connectionInterrupted);
    room.on(JitsiMeetJS.events.conference.CONNECTION_RESTORED, connectionRestored);
    room.on(JitsiMeetJS.events.conference.DATA_CHANNEL_OPENED, (data) => { console.log("DATA_CHANNEL_OPENED", data); });
    room.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (data) => { console.log("DISPLAY_NAME_CHANGED", data); });
    room.on(JitsiMeetJS.events.conference.USER_ROLE_CHANGED, (data) => { console.log("USER_ROLE_CHANGED", data); });
    room.on(JitsiMeetJS.events.conference.SUSPEND_DETECTED, (data) => { console.log("SUSPEND_DETECTED", data); });
    room.on(JitsiMeetJS.events.conference.PARTICIPANT_PROPERTY_CHANGED, (data) => {
        console.log("PARTICIPANT_PROPERTY_CHANGED", data);
    });
    room.on(JitsiMeetJS.events.conference.CONFERENCE_ERROR, conferenceError);
    room.on(JitsiMeetJS.events.conference.CONFERENCE_FAILED, conferenceFailed);
    room.on(JitsiMeetJS.events.conference.KICKED, kickedOut);
    room.on(JitsiMeetJS.events.conference.PARTICIPANT_KICKED, participantKickedOut);
    room.on(JitsiMeetJS.events.conference.BEFORE_STATISTICS_DISPOSED, (data) => { console.log("BEFORE_STATISTICS_DISPOSED", data); });
    room.on(JitsiMeetJS.events.conference.DTMF_SUPPORT_CHANGED, (data) => { console.log("DTMF_SUPPORT_CHANGED", data); });
    room.on(JitsiMeetJS.events.conference._MEDIA_SESSION_STARTED, (data) => { console.log("_MEDIA_SESSION_STARTED", data); });
    room.on(JitsiMeetJS.events.conference._MEDIA_SESSION_ACTIVE_CHANGED, (data) => { console.log("_MEDIA_SESSION_ACTIVE_CHANGED", data); });


    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => { console.log(`track removed!!!${track}`); });
    room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, onConferenceLeft);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined);
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.MESSAGE_RECEIVED, onMessageReceived);
    room.on(JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED, onEndPointMessageReceived);
    document.getElementById('send-chatmsg').addEventListener('click', (event) => { event.preventDefault(); sendGroupMessageToAll(); }, false);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, (track) => { localTrackMuteChanged(track) });
    room.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (userID, displayName) => {
        console.log(`${userID} - ${displayName}`)
    });
    room.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (userID, audioLevel) => { });
    room.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    // all error hanglers
    room.on(JitsiMeetJS.events.conference.PASSWORD_REQUIRED, onPasswordRequired);
    room.on(JitsiMeetJS.events.conference.PASSWORD_NOT_SUPPORTED, onPasswordNoSupported);
    room.on(JitsiMeetJS.events.conference.AUTHENTICATION_REQUIRED, onAuthenticationRequired);
    document.getElementById('chat-box').addEventListener('click', clearCounter, false);
    room.join();

    if (s.hasOwnProperty('password') && s.password) {
        console.log(s)
        room.lock(s.password).then((data) => {
        });
    }
}

function onPasswordRequired() {
    console.log("pass is required");;
}

function onPasswordNoSupported() {
    console.log("pass not supprotd");;
}

function onAuthenticationRequired() {
    console.log("Authenticaion is required");;
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed(data) {
    console.log(data);
    console.error('Connection Failed!');
    showAlert('danger', data, 'Error!', false);
    $('#sessionTitle').html(`<div class="d-flex align-items-center">&nbsp&nbsp&nbspError</div>`)
}

function sendGroupMessageToAll() {
    var text = document.getElementById('chatMsg').value;
    room.sendTextMessage(JSON.stringify({ message: text, from: session.name }));
    document.getElementById('chatMsg').value = "";

}
/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {

    console.info('current devices', devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    ;
    if (connection) {
        connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
        connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
        connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
    }
}

let isVideo = true;

/**
 * this is chaning the stream to video to desktop which means it will start sharing desktop
 */
function switchVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({ devices: [isVideo ? 'video' : 'desktop'] })
        .then(tracks => {
            localTracks.push(tracks[0]);
            localTracks[1].addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.log('local track muted'));
            localTracks[1].addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.log('local track stoped'));
            localTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(localTracks[1]);
        }).catch(error => console.log(error));
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

function copyToClipboard() {
    var copyText = document.getElementById("inviteLink");
    copyText.select();
    copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");
    alert("Copied the text: " + copyText.value);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    // room.leave();
    if (connection) {
        connection.disconnect();
    }
}

function generateSharableLink() {
    return `https://${subdomain}/${session.room}`;
}

function getRoomFromUrlPath() {
    if (window.location.hash.substr(1)) {
        return 'thankyou';
    } else {
        var url = new URL(window.location);
        return { room: url.pathname.substring(1) ? url.pathname.substring(1) : false, token: url.searchParams.get("jwt") }
    }
}

function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

function initJitsi(session) {
    connection = new JitsiMeetJS.JitsiConnection('fa34ac7e2988fcfa2d117132fefa56c4', session.access_token, options);
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, () => onConnectionSuccess(session));
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
    JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
    connection.connect();
    JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] })
        .then((tracks) => {
            onLocalTracks(tracks);
        }).catch(error => {
            showAlert('danger', error.message, 'Error!', false)
            throw error;
        });
    // connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, () => onConnectionSuccess(session));
    // connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    // connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
    // JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);
    // connection.connect();
    // JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] }).then(onLocalTracks).catch(error => {
    //     throw error;
    // });
    // if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
    //     JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
    //         const audioOutputDevices = devices.filter(d => d.kind === 'audiooutput');
    //         if (audioOutputDevices.length > 1) {
    //             $('#audioOutputSelect').html(audioOutputDevices.map(d => `<option value="${d.deviceId}">${d.label}</option>`).join('\n'));
    //             $('#audioOutputSelectWrapper').show();
    //         }
    //     });
    // }

}

function makeApiCall(payload, path) {
    return fetch(`${apiUrl}/${path}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Host': apiUrl, 'Connection': 'keep-alive' },
        body: JSON.stringify(payload)
    });
}

function showLoader(text = "", showSpinner = true) {
    if (showSpinner) {
        spinner = `<span class="spinner-border text-primary spinner-border-lg" role="status" aria-hidden="false"></span>`;
    }
    $('#sessionTitle').html(`<div class="d-flex align-items-center">${spinner}&nbsp&nbsp&nbsp${text}</div>`);
}

function switchCustomer(response) {
    $('.wrapper').addClass('member-view');
    $('#main-video .video-controls').addClass('scale-video');
    $('#main-video .video-controls i').addClass('icon-zoom');
    $('#hangoutBtn').text("Leave Session");
    setShortName(response.name, 'customer');
    // $('#localName').text(response.name); 
    $('.video-list .video-members').append(`
        <div class="member-video me">
            <div class="member-wrap-video" id="vidListMe">
                <div class="video-info">
                    <div class="name">You</div>
                    <div class="actions">
                        <i class="icon-zoom tooltip scale-video-user"  data-tooltip="Full Screen"></i>
                    </div>
                </div>
            </div>
        </div>
    `);
    toggleIcons();
    $('#main-video .video-controls .icon-zoom').bind("click", function () {
        if (window.innerWidth > 767) {
            var content = $('#content');
            if (!content.hasClass('full-screen-me') && !content.hasClass('full-screen-member')) {
                var elem = document.getElementById('main-video');
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.mozRequestFullScreen) { /* Firefox */
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { /* IE/Edge */
                    elem.msRequestFullscreen();
                }
            }
        }
    });
    toggleIcons();
}

function switchTrainer(response) {
    $('.wrapper').addClass('trainer-view');
    $('#main-video .video-controls').addClass('scale-video-trainer');
    $('#main-video .video-controls i').addClass('icon-corner');
    $('#hangoutBtn').text("End Session");
    $('#main-video .video-info').append(`<div class="actions"><i class="icon-zoom tooltip" data-tooltip="Full Screen"></i></div>`);
    setShortName(response.name, 'trainer');
    $('#localName').text(`${response.name} (Trainer)`);
    var coachButtons = `
    <div class="switcher switcher-record" id="meet-recorder">
        <label for="record">
            <i class="icon-record"></i>
            <input id="record" type="checkbox">
            <span></span>
        </label>
        <span class="record-time">0:01</span>
    </div>`;
    $('.footer-nav').append(coachButtons);

}

var urlData = getRoomFromUrlPath();
if (typeof urlData == 'string' && urlData == 'thankyou') {
    $('#thankyou').modal('show');
} else {
    if (urlData && urlData.hasOwnProperty('room') && urlData.room && urlData.hasOwnProperty('token') && urlData.token) {
        session = { room: urlData.room.replace(/\\|\//g, ''), access_token: urlData.token };
        JitsiMeetJS.init({ disableAudioLevels: false, disableSimulcast: false });
        if (OS == 'ios' || OS == 'android') {
            $('#unsupportedBrowser').modal({ "backdrop": "static" });
        } else {
            joinViaLink();
        }
    } else {
        window.onload = function () {
            $('#unauthorised').modal({ "backdrop": "static" });
        };
    }
}

function openInApp(event) {
    if (OS == 'android') {
        window.location = `${androidAppLink}/${session.room}?jwt=${session.access_token}`;
    } else if (OS == 'ios') {
        window.location = `example://test/live.punjabistudios.com/${session.room}?jwt=${session.access_token}`;
    } else {
        $('#conferenceError').modal({ "backdrop": "static" });
    }
}

function rejoin() {
    //@TODO process something here
    joinViaLink();
}

function joinViaLink() {
    var postData = { token: session.access_token, room: session.room }
    var data = resp.data;
    context = data.context;
    var user = data.context.user;
    token = session.access_token;
    $('#loginTab').modal('hide');
    showLoader("Connecting...");
    // conerting room name to lowercase
    roomDisplayName = data.meeting;
    session = { name: user.name, room: data.room.toLowerCase(), access_token: session.access_token }
    data.context.group == 'trainer' ? switchTrainer(session) : switchCustomer(session);
    response = { type: data.context.group, name: user.name };
    debugger;
    initJitsi(session);
    return;
    /**
     * in case you have your own api that authenticates the token - you can use the following code
     */
    // makeApiCall(postData, 'api/liveAuthToken')
    //     .then((resp) => {
    //         if (resp.error) throw resp.error;
    //         return resp.json();
    //     })
    //     .then((resp) => {
    //         if (resp.hasOwnProperty('error') && resp.error && !isLocalEnv) throw resp.error;
    //         var data = resp.data;
    //         context = data.context;
    //         var user = data.context.user;
    //         token = data.token;
    //         $('#loginTab').modal('hide');
    //         showLoader("Connecting...");
    //         // conerting room name to lowercase
    //         roomDisplayName = data.meeting;
    //         session = { name: user.name, room: data.room.toLowerCase(), access_token: data.token }
    //         data.context.group == 'trainer' ? switchTrainer(session) : switchCustomer(session);
    //         return { type: data.context.group, name: user.name };
    //     })
    //     .then((resp) => {
    //         toggleIcons();
    //         return resp;
    //     })
    //     .then((resp) => {
    //         response = resp;
    //         initJitsi(session);
    //     })
    //     .catch(error => {
    //         $('#loginFormBtn').prop('disabled', false)
    //         $('#loginFormBtn').html(`Join`)
    //         $("input[name=email]").addClass('is-invalid');
    //         $("input[name=password]").addClass('is-invalid');
    //         showAlert('danger', error, 'Error!', false)
    //         // throw error;
    //     });
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return { data: JSON.parse(jsonPayload) };
};