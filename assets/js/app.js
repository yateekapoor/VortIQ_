/*
 * VortIQ prototype UI.
 * This file contains browser-only demonstrations. Replace the simulation
 * functions with authenticated API calls when connecting a real backend.
 */

const APP_CONFIG = {
  simulationIntervalSeconds: 8,
  sectors: {
    alpha: {
      name: "ALPHA-07",
      perimeter: "18.4 km perimeter",
      cameras: [
        { label: "A-01 · North Ridge", status: "No confirmed activity", tooltip: "A-01 North Ridge. No confirmed activity at this time." },
        { label: "A-03 · Controlled Approach", status: "No confirmed activity", tooltip: "A-03 Controlled Approach. No confirmed activity at this time." },
        { label: "A-05 · Fence East", status: "Movement detector active", tooltip: "A-05 Fence East. MOG2 motion detector is active in the restricted region." },
        { label: "A-08 · Canal Crossing", status: "No confirmed activity", tooltip: "A-08 Canal Crossing. No confirmed activity at this time." }
      ],
      motionRoi: "ROI · Fence East",
      videos: [
        "assets/videos/01-border-fence.mp4",
        "assets/videos/03-surveillance-rural-a.mp4",
        "assets/videos/04-surveillance-rural-b.mp4",
        "assets/videos/02-person-fence.mp4"
      ]
    },
    bravo: {
      name: "BRAVO-12",
      perimeter: "13.1 km perimeter",
      cameras: [
        { label: "B-01 · West Ridge", status: "No confirmed activity", tooltip: "B-01 West Ridge. No confirmed activity at this time." },
        { label: "B-03 · Service Road", status: "No confirmed activity", tooltip: "B-03 Service Road. No confirmed activity at this time." },
        { label: "B-05 · Fence West", status: "Movement detector active", tooltip: "B-05 Fence West. MOG2 motion detector is active in the restricted region." },
        { label: "B-08 · River Crossing", status: "No confirmed activity", tooltip: "B-08 River Crossing. No confirmed activity at this time." }
      ],
      motionRoi: "ROI · Fence West",
      videos: [
        "assets/videos/02-person-fence.mp4",
        "assets/videos/01-border-fence.mp4",
        "assets/videos/03-surveillance-rural-a.mp4",
        "assets/videos/04-surveillance-rural-b.mp4"
      ]
    },
    delta: {
      name: "DELTA-03",
      perimeter: "9.6 km perimeter",
      cameras: [
        { label: "D-01 · Southern Ridge", status: "No confirmed activity", tooltip: "D-01 Southern Ridge. No confirmed activity at this time." },
        { label: "D-03 · Access Track", status: "No confirmed activity", tooltip: "D-03 Access Track. No confirmed activity at this time." },
        { label: "D-05 · South Fence", status: "Movement detector active", tooltip: "D-05 South Fence. MOG2 motion detector is active in the restricted region." },
        { label: "D-08 · Drainage Crossing", status: "No confirmed activity", tooltip: "D-08 Drainage Crossing. No confirmed activity at this time." }
      ],
      motionRoi: "ROI · South Fence",
      videos: [
        "assets/videos/04-surveillance-rural-b.mp4",
        "assets/videos/02-person-fence.mp4",
        "assets/videos/01-border-fence.mp4",
        "assets/videos/03-surveillance-rural-a.mp4"
      ]
    }
  },
  demoAccounts: {
    "operator.demo": { name: "A. Kumar", role: "Border operator", initials: "AK" },
    "supervisor.demo": { name: "Mira Shah", role: "Shift supervisor", initials: "MS" },
    "observer.demo": { name: "Sentinel Demo", role: "Read-only observer", initials: "SD" }
  },
  jobScenarios: [
    {
      clip: "CLIP-092.gif",
      title: "Vehicle movement detected",
      detail: "A-03 · controlled approach · vehicle track V-071",
      result: "Vehicle in Zone 2 · high priority",
      recipients: "Security personnel"
    },
    {
      clip: "CLIP-093.gif",
      title: "Motion sequence logged",
      detail: "A-08 · canal crossing · no sustained object track",
      result: "Motion logged · no escalation",
      recipients: "Auto-logged"
    },
    {
      clip: "CLIP-091.gif",
      title: "Restricted-line event detected",
      detail: "A-05 · fence east · persistent person track P-284",
      result: "Person in Zone 3 · critical priority",
      recipients: "Border forces · Security"
    }
  ]
};

const state = {
  account: APP_CONFIG.demoAccounts["operator.demo"],
  selectedClip: null,
  selectedLabel: "",
  selectedMediaType: "",
  selectedObjectUrl: null,
  alertRecordedForSelectedClip: false,
  detectorPromise: null,
  liveTrackerRunning: false,
  liveTrackerTimer: null,
  activeAnalysis: null,
  nextJobSeconds: APP_CONFIG.simulationIntervalSeconds,
  jobIndex: 0,
  simulationTimer: null,
  reviewRow: null
};

const elements = {
  loginScreen: document.querySelector("#login-screen"),
  appShell: document.querySelector("#app-shell"),
  loginForm: document.querySelector("#login-form"),
  loginButton: document.querySelector("#login-button"),
  username: document.querySelector("#username"),
  password: document.querySelector("#password"),
  faceInitials: document.querySelector("#face-initials"),
  faceStatus: document.querySelector("#face-status"),
  operatorInitials: document.querySelector("#operator-initials"),
  operatorName: document.querySelector("#operator-name"),
  themeToggle: document.querySelector("#theme-toggle"),
  clock: document.querySelector("#utc-clock"),
  protectedSector: document.querySelector("#protected-sector"),
  sectorHeading: document.querySelector("#sector-heading"),
  sectorDetail: document.querySelector("#sector-detail"),
  sectorCameras: [
    document.querySelector("#sector-camera-1"),
    document.querySelector("#sector-camera-2"),
    document.querySelector("#sector-camera-3"),
    document.querySelector("#sector-camera-4")
  ],
  sectorFeeds: [
    document.querySelector("#sector-feed-1"),
    document.querySelector("#sector-feed-2"),
    document.querySelector("#sector-feed-3"),
    document.querySelector("#sector-feed-4")
  ],
  sectorVideos: [
    document.querySelector("#sector-video-1"),
    document.querySelector("#sector-video-2"),
    document.querySelector("#sector-video-3"),
    document.querySelector("#sector-video-4")
  ],
  sectorStatuses: [
    document.querySelector("#sector-status-1"),
    document.querySelector("#sector-status-2"),
    document.querySelector("#sector-status-3"),
    document.querySelector("#sector-status-4")
  ],
  motionRoi: document.querySelector("#motion-roi"),
  monitorCamera: document.querySelector("#monitor-camera"),
  liveFeed: document.querySelector("#live-feed"),
  livePersonVideo: document.querySelector("#live-person-video"),
  liveTrackCanvas: document.querySelector("#live-track-canvas"),
  liveTrackStatus: document.querySelector("#live-track-status"),
  liveFeedCaption: document.querySelector("#live-feed-caption"),
  clipInput: document.querySelector("#clip-input"),
  chooseFile: document.querySelector("#choose-file"),
  uploadDrop: document.querySelector("#upload-drop"),
  selectedFile: document.querySelector("#selected-file"),
  clipPreview: document.querySelector("#clip-preview"),
  analyseButton: document.querySelector("#analyse-button"),
  analysisResult: document.querySelector("#analysis-result"),
  resultTitle: document.querySelector("#result-title"),
  resultSummary: document.querySelector("#result-summary"),
  resultObject: document.querySelector("#result-object"),
  resultConfidence: document.querySelector("#result-confidence"),
  resultRisk: document.querySelector("#result-risk"),
  resultRecipients: document.querySelector("#result-recipients"),
  resultEvidence: document.querySelector("#result-evidence"),
  sendAlert: document.querySelector("#send-alert"),
  jobTitle: document.querySelector("#job-title"),
  jobDetail: document.querySelector("#job-detail"),
  jobProgress: document.querySelector("#job-progress"),
  eventResult: document.querySelector("#event-result"),
  countdown: document.querySelector("#countdown"),
  runJob: document.querySelector("#run-job"),
  simulateAlert: document.querySelector("#simulate-alert"),
  incidentList: document.querySelector("#incident-list"),
  reviewDialog: document.querySelector("#review-dialog"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogDetail: document.querySelector("#dialog-detail"),
  toast: document.querySelector("#toast")
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("is-hidden");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.add("is-hidden");
  }, 3600);
}

function updateClock() {
  const time = new Date().toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  elements.clock.textContent = `UTC · ${time}`;
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  elements.themeToggle.textContent = theme === "dark" ? "☀" : "◐";
  localStorage.setItem("vortiq-theme", theme);
}

function initialiseTheme() {
  const savedTheme = localStorage.getItem("vortiq-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
}

function goToView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewId);
  });
  if (viewId === "monitoring") {
    startLivePersonTracker();
  } else {
    stopLivePersonTracker();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function changeProtectedSector(sectorKey) {
  const sector = APP_CONFIG.sectors[sectorKey];
  if (!sector) return;

  elements.sectorHeading.textContent = `SECTOR ${sector.name}`;
  elements.sectorDetail.textContent = sector.perimeter;
  elements.sectorCameras.forEach((camera, index) => {
    const cameraData = sector.cameras[index];
    camera.textContent = cameraData.label;
    elements.sectorStatuses[index].textContent = cameraData.status;
    elements.sectorFeeds[index].dataset.tooltip = cameraData.tooltip;
    elements.sectorVideos[index].src = sector.videos[index];
    elements.sectorVideos[index].load();
    elements.sectorVideos[index].play().catch(() => {});
  });
  elements.motionRoi.textContent = sector.motionRoi;
  elements.monitorCamera.textContent = sector.cameras[2].label;
  showToast(`Active demonstration area changed to ${sector.name}.`);
}

function selectAccount(button) {
  document.querySelectorAll(".account").forEach((account) => {
    account.classList.toggle("is-selected", account === button);
  });

  state.account = {
    name: button.dataset.name,
    role: button.dataset.role,
    initials: button.dataset.initials
  };
  elements.username.value = button.dataset.user;
  elements.password.value = button.dataset.pass;
  elements.faceInitials.textContent = state.account.initials;
  elements.faceStatus.textContent = "Face template selected · ready to verify";
}

function signIn(event) {
  event.preventDefault();
  if (!elements.username.value.trim() || !elements.password.value.trim()) {
    showToast("Enter a username and password before verifying the demo face template.");
    return;
  }

  elements.loginButton.disabled = true;
  elements.loginButton.textContent = "Verifying face template…";
  elements.faceStatus.textContent = "Simulated liveness check in progress…";

  window.setTimeout(() => {
    elements.operatorInitials.textContent = state.account.initials;
    elements.operatorName.textContent = state.account.name;
    elements.loginScreen.classList.add("is-hidden");
    elements.appShell.classList.remove("is-hidden");
    elements.loginButton.disabled = false;
    elements.loginButton.textContent = "Verify & sign in";
    startAutomaticSimulation();
    showToast(`Demo access granted for ${state.account.name}.`);
  }, 850);
}

function releaseObjectUrl() {
  if (state.selectedObjectUrl) {
    URL.revokeObjectURL(state.selectedObjectUrl);
    state.selectedObjectUrl = null;
  }
}

function previewClip(source, label, type = "image/gif") {
  state.selectedClip = source;
  state.selectedLabel = label;
  state.selectedMediaType = type;
  state.alertRecordedForSelectedClip = false;
  elements.selectedFile.textContent = label;
  elements.analyseButton.disabled = false;
  elements.analyseButton.textContent = "Analyse selected clip";
  elements.analysisResult.classList.add("is-hidden");

  const isVideo = type.startsWith("video/");
  const media = document.createElement(isVideo ? "video" : "img");
  media.src = source;
  media.alt = `Preview: ${label}`;
  if (isVideo) {
    media.controls = true;
    media.muted = true;
    media.playsInline = true;
    media.preload = "metadata";
  }
  elements.clipPreview.replaceChildren(media);
}

function selectUploadedFile(file) {
  if (!file) return;
  releaseObjectUrl();
  state.selectedObjectUrl = URL.createObjectURL(file);
  previewClip(state.selectedObjectUrl, file.name, file.type || "video/*");
}

function selectDemoClip(button) {
  releaseObjectUrl();
  previewClip(button.dataset.clip, button.dataset.label, "image/gif");
}

const RELEVANT_CLASSES = new Set(["person", "car", "truck", "bus", "motorcycle", "bicycle"]);
const VEHICLE_CLASSES = new Set(["car", "truck", "bus", "motorcycle", "bicycle"]);

function displayObjectName(objectClass) {
  return objectClass ? objectClass.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Object";
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "unknown duration";
  const wholeSeconds = Math.max(0, Math.round(seconds));
  return `${Math.floor(wholeSeconds / 60)}m ${String(wholeSeconds % 60).padStart(2, "0")}s`;
}

function waitForMediaEvent(media, eventName) {
  return new Promise((resolve, reject) => {
    const onComplete = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("The selected clip could not be read by this browser."));
    };
    const cleanup = () => {
      media.removeEventListener(eventName, onComplete);
      media.removeEventListener("error", onError);
    };
    media.addEventListener(eventName, onComplete, { once: true });
    media.addEventListener("error", onError, { once: true });
  });
}

async function loadVideoForAnalysis(source) {
  const video = document.createElement("video");
  video.src = source;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.load();
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
    await waitForMediaEvent(video, "loadedmetadata");
  }
  return video;
}

async function seekVideo(video, time) {
  const safeTime = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.05)));
  if (Math.abs(video.currentTime - safeTime) < 0.03 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return;
  }
  await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", finish);
      resolve();
    };
    const timeout = window.setTimeout(finish, 1800);
    video.addEventListener("seeked", finish, { once: true });
    video.currentTime = safeTime;
  });
}

function sampleTimesFor(duration) {
  const sampleCount = Math.min(8, Math.max(5, Math.ceil(duration / 6)));
  return Array.from({ length: sampleCount }, (_, index) => {
    const position = (index + 0.5) / sampleCount;
    return Math.min(Math.max(0, duration - 0.05), duration * position);
  });
}

function getFrameMotion(video, canvas, context, previousFrame) {
  const width = 160;
  const height = 90;
  canvas.width = width;
  canvas.height = height;
  context.drawImage(video, 0, 0, width, height);
  const currentFrame = context.getImageData(0, 0, width, height).data;
  if (!previousFrame) return { ratio: 0, frame: currentFrame };

  let changed = 0;
  let measured = 0;
  for (let pixel = 0; pixel < currentFrame.length; pixel += 16) {
    const difference = Math.abs(currentFrame[pixel] - previousFrame[pixel])
      + Math.abs(currentFrame[pixel + 1] - previousFrame[pixel + 1])
      + Math.abs(currentFrame[pixel + 2] - previousFrame[pixel + 2]);
    if (difference > 85) changed += 1;
    measured += 1;
  }
  return { ratio: changed / measured, frame: currentFrame };
}

async function loadDetector() {
  if (!window.cocoSsd) {
    throw new Error("The in-browser object detector did not load. Frame-motion evidence is still available.");
  }
  if (!state.detectorPromise) {
    state.detectorPromise = window.cocoSsd.load({ base: "lite_mobilenet_v2" }).catch((error) => {
      state.detectorPromise = null;
      throw error;
    });
  }
  return state.detectorPromise;
}

function clearLiveTrackingOverlay() {
  const context = elements.liveTrackCanvas.getContext("2d");
  context.clearRect(0, 0, elements.liveTrackCanvas.width, elements.liveTrackCanvas.height);
}

function fitLiveTrackingCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, elements.liveFeed.clientWidth);
  const height = Math.max(1, elements.liveFeed.clientHeight);
  const canvas = elements.liveTrackCanvas;
  if (canvas.width !== Math.round(width * pixelRatio) || canvas.height !== Math.round(height * pixelRatio)) {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
  return { width, height, pixelRatio };
}

function drawLivePersonBox(detection) {
  const video = elements.livePersonVideo;
  if (!video.videoWidth || !video.videoHeight) return;

  const { width, height, pixelRatio } = fitLiveTrackingCanvas();
  const context = elements.liveTrackCanvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  // The video uses object-fit: cover. Use the same scale and crop calculation
  // so the box matches the person in the rendered live camera frame.
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const renderedWidth = video.videoWidth * scale;
  const renderedHeight = video.videoHeight * scale;
  const cropX = (width - renderedWidth) / 2;
  const cropY = (height - renderedHeight) / 2;
  const [sourceX, sourceY, sourceWidth, sourceHeight] = detection.bbox;
  const x = sourceX * scale + cropX;
  const y = sourceY * scale + cropY;
  const boxWidth = sourceWidth * scale;
  const boxHeight = sourceHeight * scale;
  const confidence = Math.round(detection.score * 100);

  context.strokeStyle = "#62df7d";
  context.fillStyle = "rgba(98, 223, 125, 0.12)";
  context.lineWidth = 3;
  context.shadowColor = "rgba(98, 223, 125, 0.8)";
  context.shadowBlur = 12;
  context.fillRect(x, y, boxWidth, boxHeight);
  context.strokeRect(x, y, boxWidth, boxHeight);
  context.shadowBlur = 0;
  context.font = "700 11px system-ui, sans-serif";
  const label = `PERSON · ${confidence}%`;
  const labelWidth = context.measureText(label).width + 14;
  const labelY = Math.max(3, y - 24);
  context.fillStyle = "#62df7d";
  context.fillRect(Math.max(0, x), labelY, labelWidth, 21);
  context.fillStyle = "#102326";
  context.fillText(label, Math.max(0, x) + 7, labelY + 14);
}

function pickTrackedPerson(predictions) {
  return predictions
    .filter((prediction) => prediction.class === "person" && prediction.score >= 0.2)
    .sort((first, second) => second.score - first.score)[0] || null;
}

async function runLivePersonTracker() {
  if (!state.liveTrackerRunning) return;
  const video = elements.livePersonVideo;

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.paused) {
    try {
      const detector = await loadDetector();
      const prediction = pickTrackedPerson(await detector.detect(video, 10, 0.18));
      if (prediction) {
        drawLivePersonBox(prediction);
        elements.liveTrackStatus.textContent = "PERSON TRACKED";
        elements.liveFeedCaption.textContent = "Frame-by-frame person track · bounding box follows the detected person";
      } else {
        clearLiveTrackingOverlay();
        elements.liveTrackStatus.textContent = "SCANNING FOR PERSON";
        elements.liveFeedCaption.textContent = "No person above 20% confidence in the current video frame";
      }
    } catch (error) {
      clearLiveTrackingOverlay();
      elements.liveTrackStatus.textContent = "TRACKER UNAVAILABLE";
      elements.liveFeedCaption.textContent = "Browser detector unavailable · no simulated box is displayed";
      state.liveTrackerRunning = false;
      return;
    }
  } else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    elements.liveTrackStatus.textContent = "WAITING FOR VIDEO";
    elements.liveFeedCaption.textContent = "Waiting for a readable live video frame before starting detection";
  } else {
    elements.liveTrackStatus.textContent = "VIDEO PAUSED";
    elements.liveFeedCaption.textContent = "Video is paused; person tracking resumes when playback continues";
  }

  if (state.liveTrackerRunning) {
    state.liveTrackerTimer = window.setTimeout(runLivePersonTracker, 280);
  }
}

function startLivePersonTracker() {
  if (state.liveTrackerRunning) return;
  state.liveTrackerRunning = true;
  elements.liveTrackStatus.textContent = "LOADING TRACKER";
  elements.liveFeedCaption.textContent = "Loading the browser person detector…";
  elements.livePersonVideo.play().catch(() => {
    elements.liveTrackStatus.textContent = "VIDEO PAUSED";
    elements.liveFeedCaption.textContent = "Select play on the live clip to begin actual person tracking";
  });
  runLivePersonTracker();
}

function stopLivePersonTracker() {
  state.liveTrackerRunning = false;
  window.clearTimeout(state.liveTrackerTimer);
  state.liveTrackerTimer = null;
  clearLiveTrackingOverlay();
}

async function classifyFrame(detector, media) {
  if (!detector) return [];
  const predictions = await detector.detect(media, 20, 0.2);
  return predictions.filter((prediction) => RELEVANT_CLASSES.has(prediction.class));
}

function summariseDetections(samples) {
  const classStats = new Map();
  samples.forEach((sample, sampleIndex) => {
    sample.detections.forEach((detection) => {
      const existing = classStats.get(detection.class) || {
        objectClass: detection.class,
        detections: [],
        frameIndexes: new Set(),
        positions: []
      };
      existing.detections.push(detection);
      existing.frameIndexes.add(sampleIndex);
      existing.positions.push({
        x: (detection.bbox[0] + detection.bbox[2] / 2) / sample.width,
        y: (detection.bbox[1] + detection.bbox[3] / 2) / sample.height
      });
      classStats.set(detection.class, existing);
    });
  });

  const candidates = [...classStats.values()].sort((first, second) => {
    const firstScore = first.frameIndexes.size * 10 + Math.max(...first.detections.map((item) => item.score));
    const secondScore = second.frameIndexes.size * 10 + Math.max(...second.detections.map((item) => item.score));
    return secondScore - firstScore;
  });
  const dominant = candidates[0];
  if (!dominant) return null;

  const firstPosition = dominant.positions[0];
  const lastPosition = dominant.positions[dominant.positions.length - 1];
  const displacement = Math.hypot(lastPosition.x - firstPosition.x, lastPosition.y - firstPosition.y);
  return {
    objectClass: dominant.objectClass,
    frameCount: dominant.frameIndexes.size,
    objectCount: dominant.detections.length,
    peakScore: Math.max(...dominant.detections.map((item) => item.score)),
    displacement
  };
}

async function analyseVideoFrames(source) {
  const video = await loadVideoForAnalysis(source);
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  if (!duration) throw new Error("The clip has no readable duration or frames.");

  let detector = null;
  let detectorNote = "Object detector loaded";
  try {
    detector = await loadDetector();
  } catch (error) {
    detectorNote = error.message;
  }

  const motionCanvas = document.createElement("canvas");
  const motionContext = motionCanvas.getContext("2d", { willReadFrequently: true });
  let previousFrame = null;
  const samples = [];
  const times = sampleTimesFor(duration);

  for (const time of times) {
    await seekVideo(video, time);
    const motion = getFrameMotion(video, motionCanvas, motionContext, previousFrame);
    previousFrame = motion.frame;
    const detections = await classifyFrame(detector, video);
    samples.push({
      time,
      detections,
      motion: motion.ratio,
      width: video.videoWidth,
      height: video.videoHeight
    });
  }

  video.remove();
  const motionMeasurements = samples.slice(1).map((sample) => sample.motion);
  const motionRatio = motionMeasurements.length
    ? motionMeasurements.reduce((total, value) => total + value, 0) / motionMeasurements.length
    : 0;
  return {
    mediaKind: "video",
    duration,
    width: video.videoWidth,
    height: video.videoHeight,
    sampleCount: samples.length,
    motionRatio,
    detectorNote,
    dominant: summariseDetections(samples)
  };
}

async function analyseImageFrame(source) {
  const image = new Image();
  image.src = source;
  if (!image.complete || !image.naturalWidth) {
    await waitForMediaEvent(image, "load");
  }

  let detector = null;
  let detectorNote = "Object detector loaded";
  try {
    detector = await loadDetector();
  } catch (error) {
    detectorNote = error.message;
  }
  const detections = await classifyFrame(detector, image);
  return {
    mediaKind: "image",
    duration: null,
    width: image.naturalWidth,
    height: image.naturalHeight,
    sampleCount: 1,
    motionRatio: null,
    detectorNote,
    dominant: summariseDetections([{ detections, width: image.naturalWidth, height: image.naturalHeight }])
  };
}

function buildResultFromEvidence(evidence) {
  const motionPercent = evidence.motionRatio === null ? null : evidence.motionRatio * 100;
  const sourceFacts = [
    evidence.mediaKind === "video" ? `Duration ${formatDuration(evidence.duration)}` : "Single image frame",
    `${evidence.sampleCount} sampled ${evidence.sampleCount === 1 ? "frame" : "frames"}`,
    `${evidence.width || "?"} × ${evidence.height || "?"} px`,
    motionPercent === null ? "Motion not measured for still image" : `Frame-change ${motionPercent.toFixed(1)}%`,
    evidence.detectorNote
  ];

  if (evidence.dominant) {
    const object = evidence.dominant;
    const objectName = displayObjectName(object.objectClass);
    const persistence = object.frameCount / evidence.sampleCount;
    const movingAcrossFrame = object.displacement > 0.035;
    const persistent = evidence.mediaKind !== "image" && object.frameCount >= Math.max(2, Math.ceil(evidence.sampleCount / 2));
    const visibleMotion = motionPercent !== null && motionPercent >= 1.2;
    const borderContextMovement = persistent && (movingAcrossFrame || visibleMotion);
    const priorityScore = Math.round(Math.min(95, object.peakScore * 65 + persistence * 25 + Math.min(motionPercent || 0, 8)));
    const requiresReview = persistent || object.peakScore >= 0.8;
    const responseRoute = borderContextMovement
      ? "Border forces · Security (automatic simulation)"
      : requiresReview
        ? "Security · border forces (operator confirmation)"
      : "Operator review";
    const activity = movingAcrossFrame
      ? "The detected position shifts across the sampled frames."
      : "No reliable direction is inferred from the sampled positions.";
    const classDetail = VEHICLE_CLASSES.has(object.objectClass) ? "vehicle" : "person";

    return {
      title: borderContextMovement
        ? `Border-context ${objectName.toLowerCase()} movement detected`
        : `${objectName} observed in uploaded footage`,
      summary: borderContextMovement
        ? `${objectName} was classified in ${object.frameCount} of ${evidence.sampleCount} sampled frames and movement was confirmed. An alert has been added immediately because this prototype treats uploaded CCTV as a border-camera source. ${activity}`
        : `${objectName} was classified in ${object.frameCount} of ${evidence.sampleCount} sampled frames. ${activity} A boundary breach is not claimed because this upload has no configured sector or line-of-interest map.`,
      object: `${objectName} · ${object.objectCount} observation${object.objectCount === 1 ? "" : "s"}`,
      confidence: `${Math.round(object.peakScore * 100)}%`,
      risk: borderContextMovement ? `High · ${priorityScore}` : requiresReview ? `Priority · ${priorityScore}` : `Review · ${priorityScore}`,
      recipients: responseRoute,
      camera: "Uploaded CCTV clip",
      riskClass: borderContextMovement || requiresReview ? "high" : "medium",
      alertable: requiresReview,
      autoAlert: borderContextMovement,
      evidence: `${sourceFacts.join(" · ")} · ${classDetail} classification based on frame pixels.${borderContextMovement ? " Uploaded footage is treated as border-camera context; configure a per-camera boundary map before real deployment." : ""}`
    };
  }

  if (motionPercent !== null && motionPercent >= 1.2) {
    return {
      title: "Border-context movement detected",
      summary: `The sampled video frames changed by ${motionPercent.toFixed(1)}% on average. No person or vehicle reached the model confidence threshold, but an automatic motion alert has been added because this prototype treats uploaded CCTV as a border-camera source.`,
      object: "Motion region only",
      confidence: "No class confirmed",
      risk: "Medium · motion",
      recipients: "Border forces · Security (automatic simulation)",
      camera: "Uploaded CCTV clip",
      riskClass: "medium",
      alertable: true,
      autoAlert: true,
      evidence: `${sourceFacts.join(" · ")} · Uploaded footage is treated as border-camera context; configure a per-camera boundary map before real deployment.`
    };
  }

  return {
    title: "No person or vehicle confirmed",
    summary: "The selected footage was sampled, but the browser did not confirm a person or vehicle above the confidence threshold. No field alert is recommended from this clip.",
    object: "No high-confidence class",
    confidence: "Below analysis threshold or unavailable",
    risk: "No alert",
    recipients: "No field alert",
    camera: "Uploaded CCTV clip",
    riskClass: "medium",
    alertable: false,
    autoAlert: false,
    evidence: sourceFacts.join(" · ")
  };
}

function renderAnalysisResult(result) {
  state.activeAnalysis = result;
  elements.resultTitle.textContent = result.title;
  elements.resultSummary.textContent = result.summary;
  elements.resultObject.textContent = result.object;
  elements.resultConfidence.textContent = result.confidence;
  elements.resultRisk.textContent = result.risk;
  elements.resultRecipients.textContent = result.recipients;
  elements.resultEvidence.textContent = result.evidence;
  elements.sendAlert.disabled = !result.alertable || result.autoAlert;
  elements.sendAlert.textContent = result.autoAlert
    ? "Alert logged automatically"
    : result.alertable
    ? "Alert border forces & security"
    : "No field alert recommended";
  elements.analysisResult.classList.remove("is-hidden");
}

async function runAnalysis() {
  if (!state.selectedClip) return;
  elements.analyseButton.disabled = true;
  elements.analyseButton.textContent = "Reading video frames…";
  elements.analysisResult.classList.add("is-hidden");

  try {
    const evidence = state.selectedMediaType.startsWith("video/")
      ? await analyseVideoFrames(state.selectedClip)
      : await analyseImageFrame(state.selectedClip);
    const result = buildResultFromEvidence(evidence);
    renderAnalysisResult(result);
    if (result.autoAlert && !state.alertRecordedForSelectedClip) {
      addIncident(result);
      state.alertRecordedForSelectedClip = true;
      showToast("Border-context movement detected: alert added to the incident desk automatically.");
    } else {
      showToast("Clip analysis complete. Results are based on the selected file’s sampled frames.");
    }
  } catch (error) {
    renderAnalysisResult({
      title: "Clip could not be analysed",
      summary: "This browser could not decode the selected media. No detection or alert has been created.",
      object: "Unavailable",
      confidence: "Unavailable",
      risk: "No alert",
      recipients: "No field alert",
      camera: "Uploaded CCTV clip",
      riskClass: "medium",
      alertable: false,
      autoAlert: false,
      evidence: error.message
    });
    showToast("No result was invented: the selected clip could not be read.");
  } finally {
    elements.analyseButton.disabled = false;
    elements.analyseButton.textContent = "Analyse selected clip again";
  }
}

function addIncident(result) {
  const now = new Date().toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${now}</td>
    <td><b>${result.title}</b><small>${result.object} · clip reference retained</small></td>
    <td>${result.camera}</td>
    <td><span class="risk ${result.riskClass}">${result.risk}</span></td>
    <td>${result.recipients}</td>
    <td><span class="status waiting">Awaiting review</span></td>
    <td><button class="button button-quiet review-button">Review</button></td>
  `;
  elements.incidentList.prepend(row);
  return row;
}

function sendAlert() {
  if (!state.activeAnalysis) {
    showToast("Run clip analysis before sending a simulated alert.");
    return;
  }
  if (!state.activeAnalysis.alertable) {
    showToast("No field alert is recommended until a person or vehicle is confirmed in the clip.");
    return;
  }
  if (state.activeAnalysis.autoAlert) {
    showToast("This event was already added automatically to the incident desk.");
    return;
  }
  addIncident(state.activeAnalysis);
  showToast(`Simulated alert recorded for ${state.activeAnalysis.recipients}.`);
}

function updateEventResult(scenario) {
  const [heading, ...rest] = scenario.result.split(" · ");
  elements.eventResult.innerHTML = `
    <span>EVENT RESULT</span>
    <b>${heading}</b>
    <p>${rest.join(" · ")} · ${scenario.recipients}</p>
  `;
  elements.eventResult.classList.toggle("is-alert", scenario.result.includes("critical"));
}

function runBackendJob() {
  const scenario = APP_CONFIG.jobScenarios[state.jobIndex % APP_CONFIG.jobScenarios.length];
  state.jobIndex += 1;
  state.nextJobSeconds = APP_CONFIG.simulationIntervalSeconds;
  elements.jobTitle.textContent = `Processing ${scenario.clip}`;
  elements.jobDetail.textContent = "Reading saved clip · motion gate · object detection · tracking · event rules";
  elements.jobProgress.style.width = "28%";
  elements.runJob.disabled = true;

  window.setTimeout(() => {
    elements.jobProgress.style.width = "100%";
    elements.jobTitle.textContent = scenario.title;
    elements.jobDetail.textContent = scenario.detail;
    updateEventResult(scenario);
    elements.runJob.disabled = false;
    showToast(`Automatic simulation: ${scenario.result}.`);
  }, 950);
}

function startAutomaticSimulation() {
  if (state.simulationTimer) return;
  state.simulationTimer = window.setInterval(() => {
    state.nextJobSeconds -= 1;
    elements.countdown.textContent = `${state.nextJobSeconds} sec`;
    if (state.nextJobSeconds <= 0) {
      runBackendJob();
    }
  }, 1000);
}

function openReviewDialog(title, detail, row = null) {
  state.reviewRow = row;
  elements.dialogTitle.textContent = title;
  elements.dialogDetail.textContent = detail;
  elements.reviewDialog.showModal();
}

function applyReviewDecision(action) {
  const row = state.reviewRow;
  if (!row) {
    elements.reviewDialog.close();
    showToast("No incident record is selected for this decision.");
    return;
  }

  const timestamp = new Date().toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const evidence = row.cells[1].querySelector("small");
  const recipients = row.cells[4];
  const status = row.cells[5];
  const actionButton = row.querySelector(".review-button");

  if (action === "clear") {
    recipients.textContent = "No field alert sent";
    status.innerHTML = '<span class="status cleared">Cleared · audit logged</span>';
    evidence.textContent = `${evidence.textContent.split(" · ")[0]} · cleared ${timestamp} UTC`;
    actionButton.textContent = "Cleared";
    row.classList.add("incident-cleared");
    showToast("Incident updated in real time: cleared as non-threat.");
  } else {
    recipients.textContent = "C2 · Border forces · Security";
    status.innerHTML = '<span class="status escalated">Escalated · C2 notified</span>';
    evidence.textContent = `${evidence.textContent.split(" · ")[0]} · escalated ${timestamp} UTC`;
    actionButton.textContent = "Escalated";
    row.classList.add("incident-escalated");
    showToast("Incident updated in real time: escalation sent to C2.");
  }

  actionButton.disabled = true;
  elements.reviewDialog.close();
  state.reviewRow = null;
}

function bindEvents() {
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => goToView(button.dataset.viewTarget));
  });
  document.querySelector("[data-view-link]").addEventListener("click", () => goToView("overview"));

  document.querySelectorAll(".account").forEach((button) => {
    button.addEventListener("click", () => selectAccount(button));
  });
  elements.loginForm.addEventListener("submit", signIn);

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });
  elements.protectedSector.addEventListener("change", () => {
    changeProtectedSector(elements.protectedSector.value);
  });

  elements.chooseFile.addEventListener("click", () => elements.clipInput.click());
  elements.clipInput.addEventListener("change", () => selectUploadedFile(elements.clipInput.files[0]));
  document.querySelectorAll(".demo-clip").forEach((button) => {
    button.addEventListener("click", () => selectDemoClip(button));
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    elements.uploadDrop.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.uploadDrop.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    elements.uploadDrop.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.uploadDrop.classList.remove("is-dragover");
    });
  });
  elements.uploadDrop.addEventListener("drop", (event) => selectUploadedFile(event.dataTransfer.files[0]));
  elements.analyseButton.addEventListener("click", runAnalysis);
  elements.sendAlert.addEventListener("click", sendAlert);

  elements.runJob.addEventListener("click", runBackendJob);
  elements.simulateAlert.addEventListener("click", () => {
    const result = {
      title: "Restricted-line movement detected",
      object: "Person · P-302",
      camera: "A-05 · Fence East",
      risk: "Critical · 90",
      recipients: "Border forces · Security",
      riskClass: "critical"
    };
    const row = addIncident(result);
    openReviewDialog(result.title, "New simulated Zone 3 event. Confirm the visual evidence, then record the operator decision.", row);
  });
  elements.incidentList.addEventListener("click", (event) => {
    if (!event.target.classList.contains("review-button")) return;
    const row = event.target.closest("tr");
    openReviewDialog(row.cells[1].innerText, `${row.cells[2].innerText} · ${row.cells[3].innerText} · ${row.cells[4].innerText}`, row);
  });
  document.querySelector("#close-dialog").addEventListener("click", () => elements.reviewDialog.close());
  document.querySelector("#clear-event").addEventListener("click", () => {
    applyReviewDecision("clear");
  });
  document.querySelector("#escalate-event").addEventListener("click", () => {
    applyReviewDecision("escalate");
  });
}

initialiseTheme();
updateClock();
window.setInterval(updateClock, 1000);
bindEvents();
