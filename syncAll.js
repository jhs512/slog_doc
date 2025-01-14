import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { createBackup } from "./backup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// refreshKey 읽기
const refreshKey = fs
  .readFileSync(path.join(__dirname, "refreshKey.secret"), "utf-8")
  .trim();

async function syncFile(filename) {
  try {
    const id = filename.replace(".md", "");
    const filePath = path.join(__dirname, "doc", filename);

    // 현재 파일 내용 읽기
    const currentContent = fs.readFileSync(filePath, "utf-8");

    // API에서 최신 내용 가져오기
    const response = await fetch(`https://api.www.slog.gg/api/v1/posts/${id}`, {
      headers: {
        Cookie: `accessToken=EMPTY; refreshToken=${refreshKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // config 형식으로 내용 변환
    const newContent = `$$config
title: ${data.title || "제목 없음"}
published: ${data.published || false}
$$

${data.content.trim()}`;

    // 내용이 같으면 건너뛰기
    if (currentContent === newContent) {
      return false;
    }

    // 내용이 다른 경우에만 백업 생성
    await createBackup(filename, currentContent, __dirname);

    // 파일 업데이트
    fs.writeFileSync(filePath, newContent);
    console.log(`${filename} 동기화 완료`);
    return true;
  } catch (error) {
    console.error(`${filename} 동기화 중 오류 발생:`, error);
    return false;
  }
}

async function syncAll() {
  try {
    const docDir = path.join(__dirname, "doc");
    const files = fs.readdirSync(docDir);
    const mdFiles = files.filter((file) => file.endsWith(".md"));
    let updatedCount = 0;

    console.log(`총 ${mdFiles.length}개의 .md 파일을 동기화합니다...`);

    for (const file of mdFiles) {
      const wasUpdated = await syncFile(file);
      if (wasUpdated) updatedCount++;
    }

    console.log(
      `동기화 완료: 총 ${mdFiles.length}개 중 ${updatedCount}개 파일이 업데이트됨`
    );
  } catch (error) {
    console.error("동기화 중 오류 발생:", error);
    process.exit(1);
  }
}

syncAll();
