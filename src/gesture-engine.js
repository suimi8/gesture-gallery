import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";

export class GestureEngine {
  constructor() {
    this.recognizer = null;
    this.video = null;
    this.running = false;
    this.lastVideoTime = -1;
    this.results = null;

    // Callbacks
    this.onResult = () => { };
    this.onGesture = () => { };
  }

  async initialize() {
    // Use local WASM resources
    const vision = await FilesetResolver.forVisionTasks(
      "./wasm"
    );

    this.recognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        // Use local model file
        modelAssetPath: "./models/gesture_recognizer.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2  // Track both hands for dual-hand control
    });

    await this.setupCamera();
  }

  async setupCamera() {
    this.video = document.createElement("video");
    this.video.autoplay = true;
    this.video.playsInline = true;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720
      }
    });
    this.video.srcObject = stream;

    return new Promise((resolve) => {
      this.video.onloadeddata = () => {
        this.video.play();
        resolve();
      };
    });
  }

  start(callback) {
    if (callback) this.onResult = callback;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  async loop() {
    if (!this.running) return;

    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;

      const startTimeMs = performance.now();

      // Safety check if recognizer is valid
      if (this.recognizer) {
        try {
          this.results = this.recognizer.recognizeForVideo(this.video, startTimeMs);
          this.processResults(this.results);
        } catch (e) {
          console.error("Recognition Error:", e);
        }
      }
    }

    requestAnimationFrame(() => this.loop());
  }

  processResults(results) {
    // 0. Basic validation
    if (!results.landmarks || results.landmarks.length === 0) {
      this.onResult(null);
      return;
    }

    // Process each detected hand
    let rightHandData = null;
    let leftHandData = null;

    for (let i = 0; i < results.landmarks.length; i++) {
      const landmarks = results.landmarks[i];
      const handedness = results.handedness?.[i]?.[0]?.categoryName;

      if (handedness === 'Right') {
        rightHandData = this.processRightHand(landmarks, results.gestures?.[i]);
      } else if (handedness === 'Left') {
        leftHandData = this.processLeftHand(landmarks);
      }
    }

    // Build output
    const output = {
      // Right hand data (cursor control)
      ...(rightHandData || {}),
      rightHandDetected: !!rightHandData,

      // Left hand data (zoom and pan control)
      leftHandDetected: !!leftHandData,
      leftThumbUp: leftHandData?.thumbUp || false,
      leftIndexUp: leftHandData?.indexUp || false,
      leftOpenPalm: leftHandData?.openPalm || false,
      leftPalmCenter: leftHandData?.palmCenter || null,
    };

    // If no right hand and only left hand, don't control cursor
    if (!rightHandData) {
      output.canControlCursor = false;
    }

    this.onResult(output);
  }

  processRightHand(landmarks, gestures) {
    // Finger extension detection
    const isFingerExtended = (tipIdx, pipIdx) => {
      return landmarks[tipIdx].y < landmarks[pipIdx].y;
    };

    const indexExt = isFingerExtended(8, 6);
    const middleExt = isFingerExtended(12, 10);
    const ringExt = isFingerExtended(16, 14);
    const pinkyExt = isFingerExtended(20, 18);

    // Thumb detection for right hand
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const thumbExt = thumbTip.x < thumbIP.x;

    // Strict Pointing: Only Index extended
    const isStrictPointing = indexExt && !middleExt && !ringExt && !pinkyExt;

    // Pinch Ready: Index + Thumb extended
    const isPinchReady = indexExt && thumbExt && !middleExt && !ringExt && !pinkyExt;

    // Cursor position
    const indexTip = landmarks[8];
    const cursor = {
      x: 1 - indexTip.x,
      y: indexTip.y
    };

    const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    const canControlCursor = isStrictPointing || isPinchReady;

    // Open Palm detection for exit - only require 4 main fingers extended
    const isOpenPalm = indexExt && middleExt && ringExt && pinkyExt;

    return {
      cursor,
      landmarks,
      pinchDistance: pinchDist,
      isStrictPointing,
      isPinchReady,
      canControlCursor,
      isOpenPalm,
      handedness: 'Right',
      gestures
    };
  }

  processLeftHand(landmarks) {
    // Finger positions
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    const thumbTip = landmarks[4];
    const thumbMCP = landmarks[2];
    const middleTip = landmarks[12];
    const middlePIP = landmarks[10];
    const ringTip = landmarks[16];
    const ringPIP = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyPIP = landmarks[18];
    const wrist = landmarks[0];

    // Extension amount (more negative = more extended upward)
    const indexExtension = indexTip.y - indexPIP.y;
    const thumbExtension = thumbTip.y - thumbMCP.y;

    // Check if finger is extended (tip above joint)
    const indexExt = indexExtension < -0.03;
    const thumbExt = thumbExtension < -0.03;
    const middleExt = middleTip.y < middlePIP.y;
    const ringExt = ringTip.y < ringPIP.y;
    const pinkyExt = pinkyTip.y < pinkyPIP.y;

    // Open Palm: all 4 main fingers extended (for panning)
    // This takes PRIORITY over thumb/index gestures
    const openPalm = indexExt && middleExt && ringExt && pinkyExt;

    // Only check thumb/index if NOT open palm
    let thumbUp = false;
    let indexUp = false;

    if (!openPalm) {
      // Thumb up: thumb extended, middle/ring curled, thumb more prominent than index
      thumbUp = thumbExt && !middleExt && !ringExt && (thumbExtension < indexExtension);

      // Index up: index extended, middle/ring curled, index more prominent than thumb
      indexUp = indexExt && !middleExt && !ringExt && (indexExtension < thumbExtension);
    }

    // Palm center position for panning
    const palmCenter = {
      x: 1 - wrist.x,  // Mirror for screen coords
      y: wrist.y
    };

    return {
      thumbUp,
      indexUp,
      openPalm,
      palmCenter
    };
  }
}

