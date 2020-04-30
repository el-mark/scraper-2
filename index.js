const express = require('express')
const app = express()
var fs = require('fs')
const puppeteer = require('puppeteer');
const port = 3000

app.use(express.json())                         // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const PUPPETEER_OPTIONS = {
  headless: true,
  timeout: 30000,
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process',
    "--proxy-server='direct://'",
    '--proxy-bypass-list=*',
    '--deterministic-fetch'
  ]
};

const openConnection = async () => {
  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
  );
  await page.setViewport({ width: 1680, height: 1050 });
  return { browser, page };
};

const closeConnection = async (page, browser) => {
  page && (await page.close());
  browser && (await browser.close());
};
/**
 * Request to servipag
 */
app.post('/servipag', async (req, res) => {
  const url = 'https://ww3.servipag.com/pagoenlinea/portal/desktop/public/todas'

  if(req.body.client && req.body.type && req.body.company) {

    let { browser, page } = await openConnection();
    try {
      await page.goto(url, { waitUntil: 'load' });

      await page.waitForSelector('#nom_serv0')

      const serviceId = await page.evaluate(type => {
        const hFour = document.querySelectorAll("h4")
        for (var i = 0; i < hFour.length; i++) {
          if (hFour[i].textContent == type) {
            return hFour[i].id.replace('nom_serv', '')
          }
        }
      }, req.body.type)

      await page.click(`h4#nom_serv${serviceId}`)

      const selectId = `biller_${serviceId}`
      const companyId = await page.evaluate(params => {
        const options = document.querySelectorAll(`#${params.id}>option`)
        for (var i = 0; i < options.length; i++) {
          if (options[i].textContent == params.companyName) {
            return options[i].getAttribute('value')
          }
        }
      }, {id: selectId, companyName: req.body.company})
      await page.select(`select#${selectId}`, companyId),

      await page.waitForSelector(`input#input_${companyId}`)
      await page.click(`input#input_${companyId}`)
      await page.keyboard.type(req.body.client)
      await page.click(`#next-cart-step-${serviceId}`)
      // await page.waitFor(30000)

      try {
        await page.waitForSelector('.cost-detail', {
          timeout: 15000
        })
        const amount = await page.$eval('.cost-detail', el => el.innerText)
        const date = await page.$eval(`#div_cont${serviceId} .cost h4`, el => el.innerText)
        console.log({
          amount: amount,
          date: date
        })
  
        return res.json({
          amount: amount,
          date: date
        })
      } catch (error) {
        await page.waitForSelector('#help-modal')

        const amount = await page.$eval('#help-modal p', el => el.innerText)
        console.log({
          amount: amount
        })
  
        return res.json({
          amount: amount
        })
      }

    } catch (error) {
      console.log(error)
      return res.json({
          error
      })
    } finally {
      await closeConnection(page, browser);
    }
  } else {
    return res.json({
        error: 'Falta alguna variable.'
    })
  }

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = {
  app
};