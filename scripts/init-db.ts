import { execFileSync } from "node:child_process";
import path from "node:path";

async function main() {
  const prismaBin = path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.CMD" : "prisma");
  const prismaArgs = ["db", "push", "--skip-generate"];
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/c", prismaBin, ...prismaArgs], { stdio: "inherit" });
  } else {
    execFileSync(prismaBin, prismaArgs, { stdio: "inherit" });
  }

  console.log("Database schema is up to date.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
