import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path,{ dirname } from "path";
import { fileURLToPath } from 'url';
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readmeSource = fs.readFileSync("README-source.md", "utf-8");
const year = new Date().getFullYear().toString();
const folderPath = path.join(__dirname, year);

let todayContent = "";

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
  console.log(`${year}文件夹创建成功`);
} else {
  console.log(`${year}文件夹已存在`);
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Encoding": "gzip,deflate,sdch",
  "Accept-Language": "zh-CN,zh;q=0.8",
};

const gitAddCommitPush = (date: string, filename: string) => {
  const cmdGitAdd = `git add ${path.join(folderPath, filename)}`;
  const cmdGitCommit = `git commit -m "${date}"`;
  const cmdGitPush = "git push -u origin master";

  exec(cmdGitAdd);
  exec(cmdGitCommit);
  exec(cmdGitPush);
};

const getLastWeekDates = () => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const formattedDate = date
      .toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-");
    dates.push([formattedDate.split("-")[0], formattedDate]);
  }
  return dates;
};

const createMarkdown = (date: string, filename: string) => {
  console.log(`createMarkdown ${date}: ${filename}`);
  fs.writeFileSync(path.join(folderPath, filename), `## ${date}\n`);
};
const createREADME = (date: string) => {
  let lastWeekDates = getLastWeekDates();
  let lastWeekDatesStr = `## Last 7 Days\n`;
  for (let i = 0; i < lastWeekDates.length; i++) {
    lastWeekDatesStr += `- [${lastWeekDates[i][1]}](./${lastWeekDates[i][0]}/${lastWeekDates[i][1]}.md)\n`;
  }

  todayContent = `${lastWeekDatesStr}\n## ${date}\n${todayContent}`;
  fs.writeFileSync(
    path.join(__dirname, "README.md"),
    readmeSource.replace("{{today}}", todayContent)
  );
  console.log("createREADME");
};

const scrape = async (language: string, filename: string) => {
  const isTrending = language === "";
  const url = `https://github.com/trending${isTrending ? "" : "/" + language}`;
  const response = await axios.get(url, { headers: HEADERS });
  const $ = cheerio.load(response.data);
  const items = $("div.Box article.Box-row");

  const menu = isTrending ? "trending" : language;
  let result = `\n#### ${menu}\n`;

  items.each((_index, element) => {
    const title = $(element).find(".lh-condensed a").text().replace(/\s/g, "");
    const owner = $(element).find(".lh-condensed span.text-normal").text();
    const description = $(element).find("p.col-9").text();
    let url = $(element).find(".lh-condensed a").attr("href");
    url = "https://github.com" + url;
    let stars = $(element).find(".f6 a[href$=stargazers]").text().trim();
    result += `* [${title.trim()}](${url.trim()}):${description.trim()} 🧑‍💻${owner.trim()} ⭐${stars}\n`;
  });
  fs.appendFileSync(path.join(folderPath, filename), result);
  todayContent += result;
  console.log(`finished: ${menu}`);
  //   try {

  //   } catch (error) {
  //     console.log(`error: ${menu}`);
  //   }
};

const job = async () => {
  const strdate = new Date()
    .toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
  const filename = `${strdate}.md`;

  createMarkdown(strdate, filename);

  await scrape("", filename);
  await scrape("vue", filename);
  await scrape("typescript", filename);
  await scrape("javascript", filename);
  await scrape("dart", filename);
  await scrape("python", filename);

  createREADME(strdate);
  // gitAddCommitPush(strdate, filename);
};

job();
