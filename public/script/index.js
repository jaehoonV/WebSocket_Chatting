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
    $('#input_name_div').hide();
    $('#chat_container').show();
    username = $('#input_name').val();
}

$('#input').on("keydown", function(e){
    if (e.altKey && e.keyCode === 13) { // Alt key + Enter key is pressed
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
    if ($('#input').val()) {
        socket.emit("chat message", $('#input').val());
        $('#input').val("");
    }
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
    let mine_chk = username == name;
    if(mine_chk){
        message = msg;
    }else{
        message = name + " : " + msg;
    }

    let item;
    if(type == 'notice'){
        item = `<div class='notice'>${msg}</div>`;
    }else{
        if(mine_chk){
            item = `<div class='my_chat_box'>
                        <span>${msg}</span>
                        <em>${time}</em>
                        <div class="chat_r"></div>
                    </div>`;
        }else{
            item = `<div>
                        <div class='user_name'>${name}</div>
                        <div class='chat_box'>
                            <span>${msg}</span>
                            <em>${time}</em>
                            <div class="chat_l"></div>
                        </div>
                    </div>`;
        }
    }

    $('#messages').append(item);
    $("#messages").scrollTop($("#messages").prop("scrollHeight"));
}

// 채팅방 선택 및 변경
function changeSelection() {
    let select = document.getElementById("selectBox");
    let newJoinRoom = select.options[select.selectedIndex].text;

    $('#room-name').text(newJoinRoom);
    if(input_name){
        if (preJoinRoom !== newJoinRoom) {
            $('#messages').html("");
            socket.emit("new join room", preJoinRoom, newJoinRoom, username);
        }
    }
    
    preJoinRoom = newJoinRoom;
}