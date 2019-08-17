import * as path from "path";
import * as fs from "fs";
import { Server } from "http";
import * as express from "express";
import * as puppeteer from "puppeteer";
import test from "ava";

import { evaluate2 } from "../src/evaluate2";

test("Basic Test", async t => {
    const server = new MockServer();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("http://localhost:3000");

    let innerText = await evaluate2<string>(page, _path(`./tests/code.js`));
    t.is(innerText, `hello world`);

    await browser.close();
    server.close();
});

function _path(relativePath: string): string {
    return path.join(__dirname, `../..`, relativePath);
}

class MockServer {
    private _server: Server;
    private readonly _port = 3000;

    constructor() {
        const app = express();

        app.get(`/`, (req, res) => {
            res.sendFile(_path(`./tests/index.html`));
        });

        this._server = app.listen(this._port, () => console.log(`Started MockServer`));
    }

    close(): void {
        this._server.close(e => {
            if (e) console.log(e);
        });
    }
}
