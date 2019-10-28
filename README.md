# puppeteer-evaluate2

Easily create a js bundle for your `puppeteer` `evaluate` code.
## Install
> npm install --save puppeteer-evaluate2@beta
## Why?
Puppeteer stringifies all code that should be executed via the `evaluate` method.
This means it loses all information about closures etc.

This simple code will already fail at runtime:
```js
  const message = "hello world";
  await page.evaluate(() => console.log(message));
```
The `message` closure will not be available when the `evaluate` code is executed on the browser.

`puppeteer-evaluate2` solves this by creating a js bundle on the fly. In fact it is using webpack to create a bundle in memory, on the fly, that is then sent to the browser.

All you need to do is pass in your puppeteer `page` instance and the path to your entry js file:

## Usage
```js
import { evaluate2 } from "puppeteer-evaluate2";

(async () => {
    //normale puppeteer usage...
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    //...

    //easily evaluate separate file "code.js"
    //will throw if file is not found/on compile errors
    await evaluate2(page, "./code.js");

    //...
    await browser.close();
})();
```
The entry js file *must* export a default function:
```js
//code.js
export default function() {
    //all your code
}
```
Now you can nicely structure your code into several files, `puppeteer-evaluate2` will make sure that it gets included and is available: 
```js
//code.js
import { foo } from "./util";

export default function() {
    //foo will be available and ready to use
}
```
In fact you can import node modules as well:
```js
//code.js
export default function() {
    const chunk = require("lodash/chunk");

    return chunk([1, 2, 3, 4], 2);
}
```

If you want to return stuff, just return it :smirk:

Note that return values will still get serialized, like they normally would with the built in `evaluate` method.
This is a hard limitation by puppeteer itself. There's nothing that could be done here.
```js
//code.js
export default function() {
    return Array.from(document.getElementsByTagName("div")).length;
}
```
```js
const numDivs = await evaluate2(page, "./code.js");
console.log(`Found ${numDivs} divs`)
```

## Todo
* TypeScript support
* JSX support? 