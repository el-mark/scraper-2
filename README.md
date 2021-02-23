# scraper-2
The objective of this scraper is to get the client utility debts from Servipag. For example water, energy, gas, etc.

## node version compatibility
node6 - node14

## Run node
``node index.js``

## Debug or Enhance
Run node with debugger

``DEBUG=express:* node index.js``

Turn headless to false

local url
``localhost:3000/servipag``

## Request setting
Post to /Servipag

Header:

``Key: Content-Type, Value: application/x-www-form-urlencoded``

Body (x-www-form-urlencoded):

``client: 123``
``type: Luz``
``company: Enel``

## Google functions upload command
gcloud functions deploy servipag-scrapping-2 --runtime nodejs8 --trigger-http --project PROJECT_NAME --entry-point app
