import * as crypto from "crypto";
import * as fs from "fs";
import * as puppeteer from "puppeteer";
import * as webpack from "webpack";
import * as ts from "typescript";
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

            if (!hasDefaultExport(filePath)) throw new Error(`No function as default export found`);

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
    const file = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
        filePath,
        file,
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

    function walk(sourceFile: ts.SourceFile): boolean {
        let foundDefaultExport = false;

        walkNode(sourceFile);

        function walkNode(node: ts.Node) {
            switch (node.kind) {
                case ts.SyntaxKind.FunctionDeclaration:
                    if (node.modifiers) {
                        let foundModifiers = node.modifiers.filter(
                            m =>
                                m.kind === ts.SyntaxKind.ExportKeyword ||
                                m.kind === ts.SyntaxKind.DefaultKeyword
                        );

                        if (foundModifiers.length === 2) foundDefaultExport = true;
                    }
                    break;
            }

            ts.forEachChild(node, walkNode);
        }

        return foundDefaultExport;
    }

    return walk(sourceFile);
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
