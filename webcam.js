let detector;
let detectorConfig;
let poses;
let video;
let skeleton = true;
let model;
let elbowAngle = 999;
let backAngle = 0;
let reps = 0;
let upPosition = false;
let downPosition = false;
let highlightBack = false;
let canvas;
let showingPushupView = false;

function addPushup() {
  reps++;
  updateLocalStorage();
}

function togglePushUpView() {
  if (showingPushupView) {
    video.remove();
    canvas.hide();
    showingPushupView = false;
  } else {
    setup();
    canvas.show();
    showingPushupView = true;
  }
}

async function init() {
  displayPushupsTable();
  setUpSquaresForGraph();

  detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  };
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    detectorConfig
  );
  edges = {
    "5,7": "m",
    "7,9": "m",
    "6,8": "c",
    "8,10": "c",
    "5,6": "y",
    "5,11": "m",
    "6,12": "c",
    "11,12": "y",
    "11,13": "m",
    "13,15": "m",
    "12,14": "c",
    "14,16": "c",
  };
  await getPoses();
}

async function videoReady() {}

async function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, videoReady);
  video.hide();
  canvas = select("canvas");
  showingPushupView = true;
  await init();
}

async function getPoses() {
  poses = await detector.estimatePoses(video.elt);
  setTimeout(getPoses, 0);
}

function draw() {
  background(220);
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, video.width, video.height);
  drawKeypoints();
  if (skeleton) {
    drawSkeleton();
  }
  fill(255);
  strokeWeight(2);
  stroke(51);
  translate(width, 0);
  scale(-1, 1);
  textSize(40);
  if (poses && poses.length > 0) {
    let pushupString = `Push-ups completed: ${reps}`;
    text(pushupString, 100, 90);
  } else {
    text("Loading, please wait...", 100, 90);
  }
}

function drawKeypoints() {
  var count = 0;
  if (poses && poses.length > 0) {
    for (let kp of poses[0].keypoints) {
      const { x, y, score } = kp;
      if (score > 0.2) {
        count = count + 1;
        fill(255);
        stroke(0);
        strokeWeight(4);
        circle(x, y, 16);
      }
      if (count == 17) {
      }
      updateArmAngle();
      updateBackAngle();
      inUpPosition();
      inDownPosition();
    }
  }
}

function drawSkeleton() {
  confidence_threshold = 0.4;
  if (poses && poses.length > 0) {
    for (const [key, value] of Object.entries(edges)) {
      const p = key.split(",");
      const p1 = p[0];
      const p2 = p[1];
      const y1 = poses[0].keypoints[p1].y;
      const x1 = poses[0].keypoints[p1].x;
      const c1 = poses[0].keypoints[p1].score;
      const y2 = poses[0].keypoints[p2].y;
      const x2 = poses[0].keypoints[p2].x;
      const c2 = poses[0].keypoints[p2].score;
      if (c1 > confidence_threshold && c2 > confidence_threshold) {
        if (
          highlightBack == true &&
          (p[1] == 11 || (p[0] == 6 && p[1] == 12) || p[1] == 13 || p[0] == 12)
        ) {
          strokeWeight(3);
          stroke(255, 0, 0);
          line(x1, y1, x2, y2);
        } else {
          strokeWeight(2);
          stroke("rgb(0, 255, 0)");
          line(x1, y1, x2, y2);
        }
      }
    }
  }
}

function updateArmAngle() {
  leftWrist = poses[0].keypoints[9];
  leftShoulder = poses[0].keypoints[5];
  leftElbow = poses[0].keypoints[7];
  angle =
    (Math.atan2(leftWrist.y - leftElbow.y, leftWrist.x - leftElbow.x) -
      Math.atan2(leftShoulder.y - leftElbow.y, leftShoulder.x - leftElbow.x)) *
    (180 / Math.PI);
  if (angle < 0) {
  }
  if (
    leftWrist.score > 0.2 &&
    leftElbow.score > 0.2 &&
    leftShoulder.score > 0.2
  ) {
    elbowAngle = angle;
  } else {
  }
}

function updateBackAngle() {
  var leftShoulder = poses[0].keypoints[5];
  var leftHip = poses[0].keypoints[11];
  var leftKnee = poses[0].keypoints[13];
  angle =
    (Math.atan2(leftKnee.y - leftHip.y, leftKnee.x - leftHip.x) -
      Math.atan2(leftShoulder.y - leftHip.y, leftShoulder.x - leftHip.x)) *
    (180 / Math.PI);
  angle = angle % 180;
  if (leftKnee.score > 0.2 && leftHip.score > 0.2 && leftShoulder.score > 0.2) {
    backAngle = angle;
  }
  if (backAngle < 30 || backAngle > 150) {
    highlightBack = false;
  } else {
    highlightBack = true;
  }
}

function inUpPosition() {
  if (elbowAngle > 160 && elbowAngle < 200) {
    if (!upPosition) {
      reps = reps + 1;
      updateLocalStorage();
    }
    upPosition = true;
    downPosition = false;
  }
}

function inDownPosition() {
  var elbowAboveNose = false;
  if (poses[0].keypoints[0].y > poses[0].keypoints[7].y) {
    elbowAboveNose = true;
  } else {
  }
  if (
    highlightBack == false &&
    elbowAboveNose &&
    abs(elbowAngle) > 50 &&
    abs(elbowAngle) < 110
  ) {
    if (upPosition == true) {
    }
    downPosition = true;
    upPosition = false;
  }
}

function updateLocalStorage() {
  let currentDate = new Date();
  let dateString = currentDate.toLocaleDateString();
  let pushupsData = JSON.parse(localStorage.getItem("pushups")) || {};

  if (pushupsData[dateString]) {
    pushupsData[dateString] += 1; // Increment reps only when a new push-up is completed
  } else {
    pushupsData[dateString] = 1; // Set reps to 1 for a new day
  }

  localStorage.setItem("pushups", JSON.stringify(pushupsData));

  displayPushupsTable();
}

function displayPushupsTable() {
  let pushupsData = JSON.parse(localStorage.getItem("pushups")) || {};
  let table = document.getElementById("pushupTable");

  // Clear existing table rows
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  // Populate the table with pushup data
  for (let date in pushupsData) {
    let row = table.insertRow(1);
    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);

    // Convert date to long date format
    let longDate = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    cell1.innerHTML = longDate;
    cell2.innerHTML = pushupsData[date];
  }
}

function setUpSquaresForGraph() {
  const squares = document.querySelector(".squares");
  const startDate = new Date("January 1, 2024"); // Set your desired start date
  for (let i = 0; i < 365; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const level = 0;
    const li = document.createElement("li");
    li.setAttribute("data-level", level);
    li.setAttribute("title", formattedDate); // Set the formatted date as the tooltip
    li.textContent = ""; // You can add some content to the li if needed
    squares.appendChild(li);
  }
}
function convertToDayOfYear(dateString) {
  // Parse the date string into a Date object
  const parts = dateString.split("/");
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  const inputDate = new Date(year, month - 1, day); // month is 0-indexed in JavaScript Date

  // Calculate the day of the year
  const startOfYear = new Date(year, 0, 1);
  const timeDifference = inputDate - startOfYear;
  const dayOfYear = Math.floor(timeDifference / (24 * 60 * 60 * 1000)) + 1;

  return dayOfYear;
}

window.addEventListener("load", function () {
  let pushupsData = JSON.parse(localStorage.getItem("pushups")) || {};
  const max = Math.max(...Object.values(pushupsData));
  const increment = Math.ceil(max / 3);

  for (let date in pushupsData) {
    const dateNumber = convertToDayOfYear(date);

    const pushUpsForDate = pushupsData[date];

    const relativeValue = Math.ceil(pushUpsForDate / increment);

    //get ith sqaure and change color
    const squares = document.querySelector(".squares");
    const square = squares.children[dateNumber - 1];
    square.attributes["data-level"].value = relativeValue;

    //Append total number of push ups to the title
    const existingTitle = square.getAttribute("title");
    const updatedTitle = `${existingTitle}, ${pushUpsForDate} push up${
      pushUpsForDate > 1 ? "s" : ""
    }`;
    square.setAttribute("title", updatedTitle);
  }
});
