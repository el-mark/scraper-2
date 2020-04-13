const express = require('express')
const app = express()
var fs = require('fs')
const puppeteer = require('puppeteer');
const port = 3000

app.use(express.json())                         // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const PUPPETEER_OPTIONS = {
  headless: false,
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--timeout=30000',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process',
    "--proxy-server='direct://'",
    '--proxy-bypass-list=*',
    '--deterministic-fetch',
  ],
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
      await page.goto('https://medium.com/', { waitUntil: 'load' });

      await page.waitForSelector('#nom_serv0')

      // const h4s = await page.$eval('h4', el => el.innerText)

      // const getHFours = () => {
      //   // let hFourArray = []
      //   // const hFour = document.querySelectorAll("h4")
      //   // for (var i = 0; i < hFour.length; i++) {
      //   //   hFourArray.push({
      //   //     content:  
      //   //     hFour[i].textContent
      //   //   })
      //   // }

      //   return 'hola';
      // }
      

      const serviceId = await page.evaluate(type => {
        const hFour = document.querySelectorAll("h4")
        for (var i = 0; i < hFour.length; i++) {
          if (hFour[i].textContent == type) {
            return hFour[i].id.replace('nom_serv', '')
          }
        }
      }, req.body.type)

      await page.click(`h4#nom_serv${serviceId}`)
      // const hThree = await page.$eval('.top-service>h3', el => el.innerText)
      // console.log(hThree)

      await page.waitForSelector(`#biller_${serviceId}`)
      await page.click(`#biller_${serviceId}`, req.body.company),
      
      // await page.keyboard.type(req.body.client)
    
      // await page.click('.next-cart-step-23')
      await page.waitFor(30000)

      // await page.waitForSelector('section.paymentComponentGeneralFormContact[style=""]')

      // const numberAccount = await page.$eval('span#numberAccountSpan', el => el.innerText)

      console.log({
        amount: 'hola'
      })

      browser.close()

      return res.json({
        amount: 'hola'
      })
    } catch (error) {
      console.log(error)
      browser.close()
      return res.json({
          error
      })
    } finally {
      await closeConnection(page, browser);
    }
  }

  return res.json({
      error: 'Falta alguna bariable.'
  })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))