const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const axios = require('axios')

let cacheData = []

const typeDefs = gql`
  type Query {
    getMasks(limit: Int, offset: Int): MaskDataPayload
  }
  type MaskDataPayload {
    payload: [Mask]
    message: String
    status: String
    errors: [String]
  }
  type Mask {
    code: String
    name: String
    address: String
    phone: String
    adult_count: Int
    child_count: Int
    updated_at: String
  }
`

const resolvers = {
  Query: {
    getMasks: () => {
      return {
        payload: cacheData,
        status: 200,
        message: 'Success',
        errors: null
      }
    }
  },
};

const server = new ApolloServer({
  playground: true,
  cors: true,
  typeDefs,
  resolvers
});
const app = express();

const html = `<html>
  <head>
    <title>健保特約機構口罩剩餘數量明細清單 - GraphQL開放版</title>
    <meta property="og:title" content="健保特約機構口罩剩餘數量明細清單 - GraphQL開放版" />
    <meta property="og:description" content="政府公開資料可直接使用於 website cline 端的 GraphQL 開放版" />
    <meta property="og:image" content="https://i.imgur.com/vu5Gs8d.png" />
  </head>
  <body>
    <h1 style='text-align: center;'>健保特約機構口罩剩餘數量明細清單 - GraphQL開放版</h1>
    <div style='text-align: center;'>Endpoint: <a href='/graphql'>/graphql</a></div>
    <div style='display: flex; justify-content: space-around;'>
      <div>
        <h2 style='text-align: center;'>Query</h2>
        <pre>
          query {
            getMasks {
              payload {
                ## 醫事機構代碼
                code
                ## 醫事機構名稱
                name
                ## 醫事機構地址
                address
                ## 醫事機構電話
                phone
                ## 成人口罩總剩餘數
                adult_count
                ## 兒童口罩剩餘數
                child_count
                ## 來源資料時間
                updated_at
              }
              message
              errors
              status
            }
          }
        </pre>
      </div>
      <div>
        <h2 style='text-align: center;'>Response</h2>
        <pre>
          {
            "data": {
              "getMasks": {
                "payload": [
                  {
                    "code": "1234567890",
                    "name": "範例藥局1",
                    "address": "臺北市大安區範例路一段1號",
                    "phone": "02-12345671",
                    "adult_count": 30,
                    "child_count": 20,
                    "updated_at": "2020/02/04 18:30"
                  },
                  {
                    ...
                  },
                  {
                    ...
                  }
                ],
                "message": "Success",
                "errors": null,
                "status": "200"
              }
            }
          }
        </pre>
      </div>
    </div>
  </body>
</html>`
app.get('/', (req, res) => {
  res.status(200).send(html)
})

server.applyMiddleware({app });

app.listen(process.env.PORT || 53310, () => {
  console.log('Server is running on port ' + process.env.PORT)
})

let jobIsRun = false

async function farmer() {
  const maskData = await axios({
    url: 'http://data.nhi.gov.tw/Datasets/Download.ashx?rid=A21030000I-D50001-001&l=https://data.nhi.gov.tw/resource/mask/maskdata.csv'
  }).then(r => r.data)
  console.log(maskData)
  const splitData = maskData.split('\n')
  // const fieldsLine = splitData[0].split(',').map(field => field.replace('\r', ''))
  const newData = []
  for(let i = 1; i < splitData.length - 2; i++) {
    newData.push({
      code: splitData[i].split(',')[0],
      name: splitData[i].split(',')[1],
      address: splitData[i].split(',')[2],
      phone: splitData[i].split(',')[3],
      adult_count: splitData[i].split(',')[4],
      child_count: splitData[i].split(',')[5],
      updated_at: splitData[i].split(',')[6].replace('\r', ''),
    })
  }
  console.log(newData)
  cacheData = newData
  jobIsRun = false
}

setInterval(() => {
  if (jobIsRun) return
  jobIsRun = true
  farmer()
}, 10000)
farmer()