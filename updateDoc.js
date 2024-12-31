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

function parseContent(content) {
  // config 섹션이 있는지 확인
  if (content.startsWith("$$config")) {
    const configEndIndex = content.indexOf("$$", 2);
    if (configEndIndex === -1) {
      return { title: null, published: null, content };
    }

    const configSection = content.substring(8, configEndIndex);
    const mainContent = content.substring(configEndIndex + 4);

    // config 파싱
    const configLines = configSection.split("\n");
    const config = {};

    configLines.forEach((line) => {
      const [key, value] = line.split(": ").map((s) => s.trim());
      if (key === "published") {
        config[key] = value === "true";
      } else {
        config[key] = value;
      }
    });

    return {
      title: config.title || null,
      published: config.published ?? null,
      content: mainContent,
    };
  }

  // config 섹션이 없는 경우
  return {
    title: null,
    published: null,
    content,
  };
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
    const fileContent = fs.readFileSync(filePath, "utf-8").trim();

    // 파일이 비어있는지 확인
    if (fileContent.length === 0) {
      console.log(`${filename} 파일이 비어있어 업데이트를 건너뜁니다.`);
      return;
    }

    // 내용 파싱
    const { title, published, content } = parseContent(fileContent);

    // content가 비어있는지 확인
    if (content.length === 0) {
      console.log(`${filename} 파일이 비어있어 업데이트를 건너뜁니다.`);
      return;
    }

    // 백업 생성
    await createBackup(filename, fileContent, __dirname);

    // API 호출
    const response = await fetch(`https://api.www.slog.gg/api/v1/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Cookie: `accessToken=EMPTY; refreshToken=${refreshKey}`,
      },
      body: JSON.stringify({
        title,
        content,
        published,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`API 오류: ${data.resultCode}, ${data.msg}`);
    }

    console.log(`${filename} 업데이트 완료`);
  } catch (error) {
    console.error("업데이트 중 오류 발생:", error);
    process.exit(1);
  }
}

export default updateDoc;
