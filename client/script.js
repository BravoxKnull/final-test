const socket = io();
let myStream, peers = {}, myName;

const joinBtn = document.getElementById('joinBtn');
const usernameSelect = document.getElementById('username');
const rightContent = document.getElementById('right-content');

joinBtn.onclick = async () => {
  myName = usernameSelect.value;
  if (!myName || myName === 'Choose a name') return alert('Please select your name!');
  rightContent.innerHTML = `
    <h3>Welcome, ${myName}!</h3>
    <p>Users in room:</p>
    <ul id="userList"></ul>
    <div class="icons">
      <i id="micIcon" class="fas fa-microphone on"></i>
      <i id="speakerIcon" class="fas fa-volume-up on"></i>
    </div>
    <button id="leaveBtn">Leave</button>
  `;

  try {
    myStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    socket.emit('join', myName);
  } catch {
    alert('Microphone access is needed.');
  }

  document.getElementById('micIcon').onclick = () => toggleMic();
  document.getElementById('speakerIcon').onclick = () => toggleSpeaker();
  document.getElementById('leaveBtn').onclick = () => showLeaveModal();
};

function toggleMic() {
  const audioTrack = myStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  const micIcon = document.getElementById('micIcon');

  if (audioTrack.enabled) {
    micIcon.classList.replace('fa-microphone-slash', 'fa-microphone');
    micIcon.classList.add('on');
    micIcon.classList.remove('off');
  } else {
    micIcon.classList.replace('fa-microphone', 'fa-microphone-slash');
    micIcon.classList.add('off');
    micIcon.classList.remove('on');
  }
}

function toggleSpeaker() {
  const speakerIcon = document.getElementById('speakerIcon');
  const muted = speakerIcon.classList.contains('off');

  document.querySelectorAll('audio').forEach(audio => {
    audio.muted = muted;
  });

  if (muted) {
    speakerIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
    speakerIcon.classList.add('on');
    speakerIcon.classList.remove('off');
  } else {
    speakerIcon.classList.replace('fa-volume-up', 'fa-volume-mute');
    speakerIcon.classList.add('off');
    speakerIcon.classList.remove('on');
  }
}

function showLeaveModal() {
  document.getElementById('leaveModal').classList.remove('hidden');
  document.getElementById('confirmLeave').onclick = () => location.reload();
  document.getElementById('cancelLeave').onclick = () => {
    document.getElementById('leaveModal').classList.add('hidden');
  };
}

socket.on('users', (userList) => {
  const ul = document.getElementById('userList');
  if (ul) {
    ul.innerHTML = '';
    userList.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user;
      ul.appendChild(li);
    });
  }
});

socket.on('signal', ({ from, data }) => {
  if (!peers[from]) peers[from] = createPeer(false, from);
  peers[from].signal(data);
});

socket.on('new-user', (name) => {
  const peer = createPeer(true, name);
  peers[name] = peer;
});

function createPeer(initiator, remoteName) {
  const peer = new SimplePeer({
    initiator,
    trickle: true,
    stream: myStream,
    config: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  });

  peer.on('signal', (data) => {
    socket.emit('signal', { to: remoteName, data });
  });

  peer.on('stream', (remoteStream) => {
    const audio = document.createElement('audio');
    audio.srcObject = remoteStream;
    audio.autoplay = true;
    document.body.appendChild(audio);
  });

  return peer;
}
