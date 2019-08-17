# puppeteer-evaluate2
> work in progress

Write and run your `evaluate` code from an external file.
## Why?
puppeteers `evaluate` function is quite limited because code from `evaluate` will be serialized. That means you loose all your closures and whatnot.

This code will fail:
```js
  const message = "hello world";
  await page.evaluate(() => console.log(message));
```
During runtime it won't know what `message` is, since our code gets serialized.
To make this work we have to pass in `message` as an argument:
```js
  const message = "hello world";
  await page.evaluate(msg => console.log(msg), message);
```
But still, it's quite limited, e.g. we can't pass in a function:
```js
  const printHelloWorld = () => console.log("hello world");
  await page.evaluate(print => print(), printHelloWorld);
```
It will complain that `print` is not a function, which is true, since arguments get serialized too.

If you're like me and don't want to write your `evaluate` code directly into the function but rather structure it in a nice way in different files, use other packages etc you're out of luck, doesn't work (out of the box :P).

## Usage
```js
import { evaluate2 } from "puppeteer-evaluate2";

(async () => {
    //normale puppeteer usage...
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    //...

    //use evaluate2 function to execute JavaScript file in Chrome
    await evaluate2(page, "./code.js");

    await browser.close();
})();
```
That's it, you just have to import the `evaluate2` function, pass it a normal `puppeteer` page object and specify the JavaScript file that should be executed.

Just make sure that `code.js` specifies a function as default export.
This is required.
```js
//code.js
export default function() {
    //all your code
}
```
In fact, you can now import anything you want. It will just work.
```js
//code.js
import { foo } from "./util";

export default function() {
    //all your code
}
```
You can even return stuff, however it's bound to the same restrictions as the normal `evaluate` e.g. values will be serialized, so you can't return `body` or any other complex object.
```js
//code.js
export default function() {
    return Array.from(document.getElementByTagName("div")).length;
}
```
```js
const numDivs = await evaluate2(page, "./code.js");
console.log(`Found ${numDivs} divs`)
```