import * as path from "path";
import { Server } from "http";
import * as express from "express";
import * as puppeteer from "puppeteer";
import test from "ava";

import { evaluate2 } from "../src/evaluate2";

test(`Basic Test`, async t => {
    const port = 3000;
    const server = await MockServer.Create(port);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    let innerText = await evaluate2<string>(page, _path(`./tests/code.js`));
    t.is(innerText, `hello world`);

    await browser.close();
    server.close();
});

test(`lodash Test`, async t => {
    const port = 3001;
    const server = await MockServer.Create(port);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    let response = await evaluate2(page, _path(`./tests/code2.js`));
    console.dir(JSON.stringify(response, null, 4));
    t.deepEqual(response, [[1, 2], [3, 4]]);

    await browser.close();
    server.close();
});

test(`Fail on missing JavaScript file`, async t => {
    await t.throwsAsync(() => evaluate2(null as any, `doesntexist.js`));
});

function _path(relativePath: string): string {
    return path.join(__dirname, `../..`, relativePath);
}

class MockServer {
    private _server: Server;

    private constructor(private readonly _port: number, cb?: () => void) {
        const app = express();

        app.get(`/`, (req, res) => {
            res.sendFile(_path(`./tests/index.html`));
        });

        this._server = app.listen(this._port, () => {
            console.log(`Started MockServer`);

            if (cb) {
                cb();
            }
        });
    }

    close(): void {
        this._server.close(e => {
            if (e) console.log(e);
        });
    }

    static Create(port: number): Promise<MockServer> {
        return new Promise((resolve, reject) => {
            try {
                const server: MockServer = new MockServer(port, () => resolve(server));
            } catch (e) {
                reject(e);
            }
        });
    }
}
