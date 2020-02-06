const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const axios = require('axios')

const points = require('./info/points.json')

let cacheData = []

const typeDefs = gql`
  type Query {
    getMasks(offset: Int, limit: Int): MaskDataPayload
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
    location: Location
    business_hours: [String]
    adult_count: Int
    child_count: Int
    updated_at: String
  }
  type Location {
    lat: String
    lon: String
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
    <title>健保特約機構口罩剩餘數量明細清單 - GraphQL/Restful 開放版</title>
    <meta property="og:title" content="健保特約機構口罩剩餘數量明細清單 - GraphQL/Restful 開放版" />
    <meta property="og:description" content="政府公開資料可直接使用於 website cline 端的 GraphQL/Restful 開放版" />
    <meta property="og:image" content="https://i.imgur.com/vu5Gs8d.png" />
  </head>
  <body>
    <h1 style='text-align: center;'>健保特約機構口罩剩餘數量明細清單 - GraphQL/Restful 開放版</h1>
    <div style='text-align: center;'>GraphQL API Endpoint: <a href='/graphql'>/graphql</a></div>
    <div style='text-align: center;'>Restful API Endpoint: <a href='/restful/getMasks'>/restful/getMasks</a></div>
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

                ## 機構經緯度
                location {
                  lat
                  lon
                }

                ## 營業時間
                business_hours

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
                    "code": "2331200010",
                    "name": "新北市坪林區衛生所",
                    "address": "新北市坪林區坪林街１０４號",
                    "phone": "(02)26656272",
                    "location": {
                      "lat": "24.935877",
                      "lon": "121.711626"
                    },
                    "business_hours": [
                      "星期一上午看診",
                      "星期二上午看診",
                      "星期三上午看診",
                      "星期四上午看診",
                      "星期五上午看診",
                      "星期六上午休診",
                      "星期日上午休診",
                      "星期一下午看診",
                      "星期二下午看診",
                      "星期三下午休診",
                      "星期四下午看診",
                      "星期五下午看診",
                      "星期六下午休診",
                      "星期日下午休診",
                      "星期一晚上休診",
                      "星期二晚上休診",
                      "星期三晚上休診",
                      "星期四晚上休診",
                      "星期五晚上休診",
                      "星期六晚上休診",
                      "星期日晚上休診"
                    ],
                    "adult_count": 188,
                    "child_count": 46,
                    "updated_at": "2020/02/06 09:00:03"
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
app.get('/restful/getMasks', (req, res) => {
  res.status(200).send({
    payload: cacheData,
    status: 200,
    message: 'Success',
    errors: null
  })
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
  newData.forEach(mask => {
    for(let i = 0; i < points.features.length; i++) {
      if (mask.name === points.features[i].properties.name) {
        mask['location'] = {
          lon: points.features[i].geometry.coordinates[0],
          lat: points.features[i].geometry.coordinates[1],
        }
        mask['business_hours'] = points.features[i].properties.available.split('、')
        break;
      }
    }
  })
  cacheData = newData
  jobIsRun = false
}

setInterval(() => {
  if (jobIsRun) return
  jobIsRun = true
  farmer()
}, 600000)
farmer()