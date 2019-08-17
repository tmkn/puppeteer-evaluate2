import * as crypto from "crypto";
import * as puppeteer from "puppeteer";
import * as webpack from "webpack";
//import MemoryFileSystem from "memory-fs";
const MemoryFileSystem = require("memory-fs");

function getUUID(): string {
    return crypto.randomBytes(8).toString("hex");
}

interface ICompilationResult {
    src: string;
    uuid: string;
}

async function getJS(filePath: string): Promise<ICompilationResult> {
    const outputName = "blabla.js";

    return new Promise((resolve, reject) => {
        try {
            const uuid = `tmp_${getUUID()}`;
            const fs = new MemoryFileSystem();
            const compiler = webpack({
                entry: filePath,
                output: {
                    library: uuid,
                    filename: outputName,
                    path: "/"
                }
            });
            compiler.outputFileSystem = fs;

            compiler.run((err, status) => {
                if (err) {
                    reject(err.stack || err);
                }

                const info = status.toJson();
                if (status.hasErrors()) {
                    reject(info.errors);
                }

                let compiledJS = fs.readFileSync(`/${outputName}`, "utf8");

                resolve({
                    src: compiledJS,
                    uuid: uuid
                });
            });
        } catch (e) {
            reject(e);
        }
    });
}

export async function evaluate2<T = any>(page: puppeteer.Page, jsPath: string): Promise<T | void> {
    return new Promise(async (resolve, reject) => {
        try {
            let { src, uuid } = await getJS(jsPath);
            await page.addScriptTag({
                content: src
            });

            /* istanbul ignore next */
            resolve(page.evaluate(uuid => (window[uuid] as any).default(), uuid));
        } catch (e) {
            console.log(e);

            reject();
        }
    });
}