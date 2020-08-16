const socket = io('/');
const videoGrid = document.getElementById('video-grid');

// initialize Peer object with no arguments to user peerJS's server
const myPeer = new Peer();
// video element to capture video from webcam
const myVideo = document.createElement('video');
myVideo.muted = true;

/** object to store connected users
 * @example
 * {userId : call object,}
 * */

const peers = {};

// access video from webcam
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    // add video stream from webcam to video element
    addVideoStream(myVideo, stream);

    // handle connection between user via Peer object
    myPeer.on('call', (call) => {
      call.answer(stream);

      // create new video element to append to video grid
      const video = document.createElement('video');
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // when server emit user-connected
    socket.on('user-connected', (userId) => {
      connectToNewUser(userId, stream);
    });
  });

/** when socket receive 'user-disconnected'
 * 1. get call object from peers
 * 2. close connection via call.close()
 * */
socket.on('user-disconnected', (userId) => {
  if (peers[userId]) peers[userId].close();
});

/** on Peer open send emit 'join-room via socket
 * userId is created by Peer
 * */
myPeer.on('open', (id) => {
  socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });

  // add call object to peers
  peers[userId] = call;
}

/**this function
 * 1. add video stream to video element
 * 2. append video element to video grid
 */
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}
