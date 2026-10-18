import { fileURLToPath } from "node:url";
import { runChecks } from "./lib/check.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const problems = runChecks(root);
if (problems.length > 0) {
  console.log(problems.join("\n"));
  process.exit(1);
}
console.log("check: ok");
