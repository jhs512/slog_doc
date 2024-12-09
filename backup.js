import fs from "fs";
import path from "path";

export async function createBackup(filename, content, baseDir) {
  const id = filename.replace(".md", "");
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[T]/g, "-")
    .replace(/[:.]/g, "-")
    .replace("Z", "");

  const backupDir = path.join(baseDir, "backup", id);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, `${timestamp}.md`);
  fs.writeFileSync(backupPath, content);
  console.log(`백업 파일 생성: ${backupPath}`);
}
