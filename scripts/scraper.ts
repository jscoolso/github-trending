/*
 * @Author: shaojun
 * @Date: 2023-08-08 10:44:56
 * @LastEditTime: 2023-08-08 10:59:05
 * @LastEditors: shaojun
 * @Description: 
 */
import axios from 'axios';
import * as fs from 'fs'; 
import * as child_process from 'child_process';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';

async function gitAddCommitPush(date: string, filename: string) {
    const cmdGitAdd = `git add ${filename}`;
    const cmdGitCommit = `git commit -m "${date}"`;
    const cmdGitPush = 'git push -u origin master';

    child_process.execSync(cmdGitAdd);
    child_process.execSync(cmdGitCommit);
    child_process.execSync(cmdGitPush);
}

function createMarkdown(date: string, filename: string) {
    fs.writeFileSync(filename, `## ${date}\n`);
}

async function scrape(language: string, filename: string) {
    const HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip,deflate,sdch',
        'Accept-Language': 'zh-CN,zh;q=0.8'
    };

    const url = `https://github.com/trending/${language}`;
    const response = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    const items = $('div.Box article.Box-row');

    fs.appendFileSync(filename, `\n#### ${language}\n`, 'utf8');

    items.each((index, element) => {
        const title = $(element).find(".lh-condensed a").text();
        const owner = $(element).find(".lh-condensed span.text-normal").text();
        const description = $(element).find("p.col-9").text();
        let url = $(element).find(".lh-condensed a").attr("href");
        url = "https://github.com" + url;
        fs.appendFileSync(filename, `* [${title}](${url}):${description}\n`, 'utf8');
    });
}

async function job() {
    const strdate = dayjs().format('YYYY-MM-DD');
    const filename = `${strdate}.md`;

    createMarkdown(strdate, filename);

    await scrape('python', filename);
    await scrape('swift', filename);
    await scrape('javascript', filename);
    await scrape('go', filename);

    gitAddCommitPush(strdate, filename);
}

job();
