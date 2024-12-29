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

async function makeEmptyDoc() {
  // API에서 최신 내용 가져오기
  const response = await fetch(`https://api.www.slog.gg/api/v1/posts/temp`, {
    method: "POST",
    headers: {
      Cookie: `accessToken=EMPTY; refreshToken=${refreshKey}`,
    },
  });

  const rsData = await response.json();

  const id = rsData.data.id;

  const fileContent = `$$config
title: ${rsData.data.title}
published: ${rsData.data.published}
$$

생성된 파일입니다.
`;

  // 파일이 이미 있으면 패스
  if (fs.existsSync(path.join(__dirname, "doc", `${id}.md`))) {
    console.log(`파일 ${id}.md이 이미 존재합니다.`);
    return;
  }

  // 파일 생성
  fs.writeFileSync(path.join(__dirname, "doc", `${id}.md`), fileContent);

  console.log(`파일 ${id}.md이 생성되었습니다.`);
}

makeEmptyDoc();
