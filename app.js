const express = require('express');
const puppeteer = require('puppeteer');
const absolutify = require('absolutify');
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
    let { url } = req.query;

    if (!url) {
        return res.status(400).send("Url is missing!");
    }

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto(`https://${url}`);
    
        let document = await page.evaluate(() => document.documentElement.outerHTML);

        document = absolutify(document, `/?url=${url.split('/')[0]}`);
        
        await browser.close();

        return res.send(document);
    } catch(err) {
        return res.status(400).send(err.message);
    }

});

app.listen(port, () => console.log(`listening on http://localhost:${port}`));
