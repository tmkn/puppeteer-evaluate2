import * as crypto from "crypto";
import * as fs from "fs";
import * as puppeteer from "puppeteer";
import * as webpack from "webpack";
const MemoryFileSystem = require("memory-fs");

function getUUID(): string {
    return crypto.randomBytes(8).toString("hex");
}

interface ICompilationResult {
    src: string;
    uuid: string;
}

async function getJS(filePath: string): Promise<ICompilationResult> {
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync(filePath))
                throw new Error(`The entry file "${filePath}" doesn't exist`);

            const uuid = `tmp_${getUUID()}`;
            const memoryFs = new MemoryFileSystem();
            const compiler = webpack({
                mode: "development",
                entry: filePath,
                output: {
                    library: uuid,
                    filename: uuid,
                    path: "/"
                }
            });
            compiler.outputFileSystem = memoryFs;

            compiler.run((err, status) => {
                if (err) {
                    reject(err.stack || err);
                }

                const info = status.toJson();
                if (status.hasErrors()) {
                    reject(info.errors);
                }

                let compiledJS = memoryFs.readFileSync(`/${uuid}`, "utf8");

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

function hasDefaultExport(filePath: string): boolean {
    return true;
}

export function evaluate2<T = any>(page: puppeteer.Page, jsPath: string): Promise<T> {
    return new Promise(async (resolve, reject) => {
        try {
            let { src, uuid } = await getJS(jsPath);
            await page.addScriptTag({
                content: src
            });

            resolve(
                page.evaluate(
                    /* istanbul ignore next */ uuid => (window[uuid] as any).default(),
                    uuid
                )
            );
        } catch (e) {
            console.log(e);

            reject(e);
        }
    });
}
