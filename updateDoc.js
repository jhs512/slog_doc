import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// refreshKey 읽기
const refreshKey = fs
  .readFileSync(path.join(__dirname, "refreshKey.secret"), "utf-8")
  .trim();

async function createBackup(filename, content) {
  const id = filename.replace(".md", "");
  const now = new Date();

  // YYYY-MM-DD-HH-II-SS-밀리세컨드 형식의 날짜 문자열 생성
  const timestamp = now
    .toISOString()
    .replace(/[T]/g, "-")
    .replace(/[:.]/g, "-")
    .replace("Z", "");

  // 백업 디렉토리 경로
  const backupDir = path.join(__dirname, "backup", id);

  // 백업 디렉토리가 없으면 생성
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 백업 파일 경로
  const backupPath = path.join(backupDir, `${timestamp}.md`);

  // 백업 파일 생성
  fs.writeFileSync(backupPath, content);
  console.log(`백업 파일 생성: ${backupPath}`);
}

async function updateDoc(filename) {
  try {
    // 파일명에서 ID 추출
    const id = filename.replace(".md", "");
    const filePath = path.join(__dirname, "doc", filename);

    // 파일이 존재하는지 확인
    if (!fs.existsSync(filePath)) {
      throw new Error(`파일을 찾을 수 없습니다: ${filename}`);
    }

    // 파일 내용 읽기
    const content = fs.readFileSync(filePath, "utf-8");

    // 백업 생성
    await createBackup(filename, content);

    // API 호출
    const response = await fetch(
      `https://api.www.slog.gg/api/v1/posts/${id}/body`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=EMPTY; refreshToken=${refreshKey}`,
        },
        body: JSON.stringify({
          body: content,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status} ${response.statusText}`);
    }

    console.log(`${filename} 업데이트 완료`);
  } catch (error) {
    console.error("업데이트 중 오류 발생:", error);
    process.exit(1);
  }
}

// 커맨드 라인 인자로 전달된 파일명 사용
const filename = process.argv[2];
if (!filename) {
  console.error("파일명이 전달되지 않았습니다.");
  process.exit(1);
}

updateDoc(filename);
