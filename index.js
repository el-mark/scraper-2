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

      await page.waitForSelector(`.cost-detail`)
      const amount = await page.$eval('.cost-detail', el => el.innerText)

      console.log({
        amount: amount
      })

      return res.json({
        amount: amount
      })
    } catch (error) {
      console.log(error)
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

app.post('/servicio-electrico', async (req, res) => {
  const url = 'https://www.enel.cl/es/clientes/servicios-en-linea/pago-de-cuenta.html'

  if(req.body.cliente) {
      const browser = await puppeteer.launch({ headless:true, timeout: 30000 })
      
      try {
          const page = await browser.newPage()
          page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36')
  
          await page.goto(url)
          await page.waitForSelector('input#client')
  
          await page.click('input#client')
          await page.keyboard.type(req.body.cliente)
  
          await page.click('input[type=submit].generalFormContactButton')
  
          await page.waitForSelector('section.paymentComponentGeneralFormContact[style=""]')
  
          const numberAccount = await page.$eval('span#numberAccountSpan', el => el.innerText)
          const address = await page.$eval('span#addressSpan', el => el.innerText)
          const dueDate = await page.$eval('span#dueDateSpan', el => el.innerText)
          const lastPaymentDate = await page.$eval('span#lastPaymentDateSpan', el => el.innerText)
          const cutAfterValue = await page.$eval('span#cutAfterValueSpan', el => el.innerText)
          const lastPaymentAmountValue = await page.$eval('span#lastPaymentAmountValueSpan', el => el.innerText)
          const stateSuplyValue = await page.$eval('span#stateSuplyValueSpan', el => el.innerText)
          
          await page.waitFor(() => document.querySelector('div#form_contact-step-2-no').style.display === '' || document.querySelector('input[type=radio][id]'))

          const elements = await page.$$('input[type=radio][id]')
          let AmountDue = 0

          if(elements.length > 0) {
              await page.waitForSelector('input[type=radio]#invoice0', {visible: true})
              AmountDue = await page.$eval('input[type=radio]#invoice0', el => el.getAttribute('data-amount'))
          }

          console.log({
              now: new Date(),
              numberAccount,
              address,
              dueDate,
              lastPaymentDate,
              cutAfterValue,
              lastPaymentAmountValue,
              AmountDue,
          })

          browser.close()

          return res.json({
              numero_cuenta: numberAccount,
              direccion: address,
              fecha_vencimiento: new Date(dueDate.split('/')[2], dueDate.split('/')[1] - 1, dueDate.split('/')[0]),
              fecha_ultimo_pago: new Date(lastPaymentDate.split('/')[2], lastPaymentDate.split('/')[1] - 1, lastPaymentDate.split('/')[0]),
              fecha_corte: new Date(cutAfterValue.split('/')[2], cutAfterValue.split('/')[1] - 1, cutAfterValue.split('/')[0]),
              monto_ultimo_pago: parseFloat(lastPaymentAmountValue.replace('$','').replace('.','')),
              estado_suministro: stateSuplyValue,
              deuda_vigente: !!AmountDue ? parseFloat(AmountDue.replace('$', '').replace('.', '')) : 0,
          })
      } catch (error) {
          console.log(error)
          browser.close()
          return res.json({
              error
          })
      }
  }

  return res.json({
      error: 'Debes ingresar un numero de cliente.'
  })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))