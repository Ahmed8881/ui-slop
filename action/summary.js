// Writes the Markdown report to the job summary and the score to step outputs.
import { readFileSync, appendFileSync } from "node:fs";
import { markdown, text } from "../src/report.js";

const result = JSON.parse(readFileSync(process.argv[2], "utf8"));
console.log(text(result));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown(result) + "\n");
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `score=${result.score}\nissues=${result.issues}\n`);
