const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// doc 디렉토리 경로
const docDir = path.join(__dirname, "doc");

// 전역 타임아웃 변수 선언
let timeoutId = null;

// 파일 변경 감지 및 updateDoc.js 실행 함수
function runUpdateDoc(filename) {
  console.log(`파일 변경 감지: ${filename}`);

  // .md 파일인지 확인
  if (!filename.endsWith(".md")) {
    return;
  }

  const updateScript = spawn("node", ["updateDoc.js", filename], {
    stdio: "inherit",
    shell: true,
  });

  updateScript.on("error", (error) => {
    console.error("스크립트 실행 중 오류 발생:", error);
  });

  updateScript.on("exit", (code) => {
    if (code === 0) {
      console.log("updateDoc.js 실행 완료");
    } else {
      console.error(`updateDoc.js 실행 실패 (종료 코드: ${code})`);
    }
  });
}

// 디렉토리 감시 시작
console.log("doc 디렉토리 감시 시작...");

// 디렉토리 변경 감지
fs.watch(docDir, (eventType, filename) => {
  if (eventType === "change" && filename) {
    // 중복 실행 방지를 위한 디바운싱 (300ms)
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      runUpdateDoc(filename);
    }, 300);
  }
});

// 에러 처리
process.on("uncaughtException", (error) => {
  console.error("예기치 않은 오류 발생:", error);
});
