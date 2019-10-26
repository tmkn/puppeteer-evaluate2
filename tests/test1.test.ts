import * as path from "path";
import { Server } from "http";
import * as express from "express";
import * as puppeteer from "puppeteer";

import { evaluate2 } from "../src/evaluate2";

test(`Basic Test`, async () => {
    const port = 3000;
    const server = await MockServer.Create(port);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    let innerText = await evaluate2<string>(page, _path(`./tests/code.js`));
    expect(innerText).toBe(`hello world`);

    await browser.close();
    server.close();
});

test(`lodash Test`, async () => {
    const port = 3001;
    const server = await MockServer.Create(port);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    let response = await evaluate2(page, _path(`./tests/code2.js`));
    expect(response).toEqual([[1, 2], [3, 4]]);

    await browser.close();
    server.close();
});

test(`Fail on missing JavaScript file`, async () => {
    expect.assertions(1);

    try {
        await evaluate2(null as any, `doesntexist.js`);
    } catch (e) {
        expect(e).toBeInstanceOf(Error);
    }
});

test(`Fail on missing default export function`, async () => {
    expect.assertions(1);

    try {
        await evaluate2(null as any, _path(`./tests/nodefaultexport.js`));
    } catch (e) {
        expect(e).toBeInstanceOf(Error);
    }
});

function _path(relativePath: string): string {
    return path.join(__dirname, `../`, relativePath);
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
