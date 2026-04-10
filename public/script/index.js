let preJoinRoom = "";
let username;
$('#chat_container').hide();
const socket = io();

$('#input_name').on("keydown", function(e){
    if(e.which===13){
        e.preventDefault();
        nameSave();
    }
});

function nameSave(){
    let raw = $('#input_name').val();
    let safe = sanitizeUsername(raw);

    if (!safe) return;

    username = safe;

    $('#input_name_div').hide();
    $('#chat_container').show();
    $('#chat-wrapper').hide();
}

const $chatInput = $('#chat_input');
const MAX_LINES = 5;

function autoResize() {
    const el = $chatInput[0];
    const lineHeight = parseInt($chatInput.css('line-height')) || 20;
    const paddingTop = parseInt($chatInput.css('padding-top')) || 0;
    const paddingBottom = parseInt($chatInput.css('padding-bottom')) || 0;
    const maxHeight = lineHeight * MAX_LINES + paddingTop + paddingBottom;

    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';

    if (el.scrollHeight > maxHeight) {
        el.style.overflowY = 'auto';
    } else {
        el.style.overflowY = 'hidden';
    }
}

// 입력할 때마다 높이 조절
$chatInput.on('input', function () {
    autoResize();
});

$('#chat_input').on("keydown", function(e){
    if ((e.altKey || e.shiftKey) && e.keyCode === 13) { // Alt, Shift  key + Enter key is pressed
        $('#chat_input').blur();
        $('#chat_input').val($('#chat_input').val() + "\n");
        $('#chat_input').focus();
        e.preventDefault();
    }else if(e.which===13){
        e.preventDefault();
        send();
    }
});

// 메시지 입력 후 보내기
function send() {
    const msg = $('#chat_input').val();
    if (!msg || !msg.trim()) return;

    socket.emit("chat message", msg);
    $('#chat_input').val('');

    autoResize();
}

// 참여자 입출여부 공지
socket.on("notice", (currentChatRoomUserList, userNum, name, msg) => {
    $('#user-num').text(`참여자 수 : ${userNum}`);
    $('#user-list').text(`참여자 : ${currentChatRoomUserList}`);
    const message = name + msg;
    createNewMessage(name, message, 'notice');
});

// 실시간 채팅 박스 생성
socket.on("chat message", (name, msg, time) => {
    createNewMessage(name, msg, 'chat', time);
});

// 메시지 새로 생성
function createNewMessage(name, msg, type, time) {
    const mineChk = username === name;

    if (type === 'notice') {
        const $notice = $('<div>').addClass('notice').text(msg);
        $('#messages').append($notice);
        $("#messages").scrollTop($("#messages").prop("scrollHeight"));
        return;
    }

    if (mineChk) {
        const $wrapper = $('<div>').addClass('my_chat_box');
        const $span = $('<span>').text(msg);
        const $time = $('<em>').text(time);
        const $tail = $('<div>').addClass('chat_r');

        $wrapper.append($span, $time, $tail);
        $('#messages').append($wrapper);
    } else {
        const $outer = $('<div>');
        const $userName = $('<div>').addClass('user_name').text(name);
        const $chatBox = $('<div>').addClass('chat_box');
        const $span = $('<span>').text(msg);
        const $time = $('<em>').text(time);
        const $tail = $('<div>').addClass('chat_l');

        $chatBox.append($span, $time, $tail);
        $outer.append($userName, $chatBox);
        $('#messages').append($outer);
    }

    $("#messages").scrollTop($("#messages").prop("scrollHeight"));
}

// 채팅방 선택 및 변경
function changeSelection() {
    let select = document.getElementById("selectBox");
    let newJoinRoom = select.options[select.selectedIndex].text;

    $('#room-name').text(newJoinRoom);

    if(username){
        $('#chat-wrapper').show();
        $('#chat_input').focus();

        if (preJoinRoom !== newJoinRoom) {
            $('#messages').html("");
            socket.emit("new join room", preJoinRoom, newJoinRoom, username);
        }
    }
    
    preJoinRoom = newJoinRoom;
}

function sanitizeUsername(name) {
    return name
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[<>]/g, "")
        .slice(0, 20);
}