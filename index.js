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

app.post('/servipag', async (req, res) => {

  if(req.body.client && req.body.company) {
    const url = 'https://ww3.servipag.com/pagoenlinea/portal/desktop/public/generico'
    // console.log(url);
    let { browser, page } = await openConnection();
    try {
      await page.goto(url, { waitUntil: 'load' });
  
      await page.waitForSelector('.search-input input')
      await page.click('.search-input input')
      await page.keyboard.type(req.body.company)
  
      await page.waitForSelector('#containerScroll ul li:nth-child(1)')
      await page.click('#containerScroll ul li:nth-child(1)')
  
      // await page.waitForSelector('.middle-service')
  
      // const companyId = await page.evaluate(params => {
      //   const options = document.querySelectorAll('.middle-service select>option')
      //   for (var i = 0; i < options.length; i++) {
      //     if (options[i].textContent == params.companyName) {
      //       return options[i].getAttribute('value')
      //     }
      //   }
      // }, {companyName: req.body.company})
  
      await page.waitForSelector(`.input-field input`)
      await page.click(`.input-field input`)
      await page.keyboard.type(req.body.client)
      await page.click('.service-action')
      // await page.waitFor(30000)
  
      try {
        await page.waitForSelector('.type-list')

        const amountElements = await page.$$('.type-list .item-payment');

        // console.log('debug logg');
        // console.log(amountElements);
        // console.log(amountElements.length);

        async function generateAmountArray () {

          let amountArray = []
          for (let i = 1; i <= amountElements.length; i++) {
  
            const amount = await page.$eval(`.type-list .item-payment:nth-child(${i}) .info span`, el => el.innerText);
            const date = await page.$eval(`.type-list .item-payment:nth-child(${i}) .cost-value`, el => el.innerText);
  
            amountArray.push([ date, amount ]);
          }

          return amountArray;
        
        }

        const amounts = await generateAmountArray();


        // const amountElementsIds = await page.evaluate(() => Array.from(document.getElementsByClassName('cost'), e => e.id));
        
        // async function generateAmountArray () {
        //   let amountArray = []
        //   for(const elementId of amountElementsIds) {
        //     const amount = await page.$eval("#" + elementId + " .cost-detail", el => el.innerText);
        //     const date = await page.$eval("#" + elementId + " h4", el => el.innerText);

        //     amountArray.push([ date, amount ]);
        //   }
        //   return amountArray
        // }

        // const amounts = await generateAmountArray();

        console.log({
          amounts: amounts
        })
  
        return res.json({
          amounts: amounts
        })
      } catch (error) {
        await page.waitForSelector('.modal-content')
  
        const message = await page.$eval('.modal-body p', el => el.innerText)
        console.log({
          message: message
        })
  
        return res.json({
          message: message
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

// app.post('/servipag-old', async (req, res) => {
//   const url = 'https://ww3.servipag.com/pagoenlinea/portal/desktop/public/todas'

//   if(req.body.client && req.body.type && req.body.company) {

//     let { browser, page } = await openConnection();
//     try {
//       await page.goto(url, { waitUntil: 'load' });

//       await page.waitForSelector('#nom_serv0')

//       const serviceId = await page.evaluate(type => {
//         const hFour = document.querySelectorAll("h4")
//         for (var i = 0; i < hFour.length; i++) {
//           if (hFour[i].textContent == type) {
//             return hFour[i].id.replace('nom_serv', '')
//           }
//         }
//       }, req.body.type)

//       await page.click(`h4#nom_serv${serviceId}`)

//       const selectId = `biller_${serviceId}`
//       const companyId = await page.evaluate(params => {
//         const options = document.querySelectorAll(`#${params.id}>option`)
//         for (var i = 0; i < options.length; i++) {
//           if (options[i].textContent == params.companyName) {
//             return options[i].getAttribute('value')
//           }
//         }
//       }, {id: selectId, companyName: req.body.company})
//       await page.select(`select#${selectId}`, companyId),

//       await page.waitForSelector(`input#input_${companyId}`)
//       await page.click(`input#input_${companyId}`)
//       await page.keyboard.type(req.body.client)
//       await page.click(`#next-cart-step-${serviceId}`)
//       // await page.waitFor(30000)

//       try {
//         await page.waitForSelector('.cost-detail')
//         const amount = await page.$eval('.cost-detail', el => el.innerText)
//         const date = await page.$eval(`#div_cont${serviceId} .cost h4`, el => el.innerText)
//         console.log({
//           amount: amount,
//           date: date
//         })
  
//         return res.json({
//           amount: amount,
//           date: date
//         })
//       } catch (error) {
//         await page.waitForSelector('#help-modal')

//         const amount = await page.$eval('#help-modal p', el => el.innerText)
//         console.log({
//           amount: amount
//         })
  
//         return res.json({
//           amount: amount
//         })
//       }

//     } catch (error) {
//       console.log(error)
//       return res.json({
//           error
//       })
//     } finally {
//       await closeConnection(page, browser);
//     }
//   } else {
//     return res.json({
//         error: 'Falta alguna variable.'
//     })
//   }

// })

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = {
  app
};