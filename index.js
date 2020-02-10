const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const {
  createRateLimitTypeDef,
  createRateLimitDirective
} = require("graphql-rate-limit-directive");
const compression = require("compression");
const axios = require("axios");
const CronJob = require("cron").CronJob;

const points = require("./info/points.json");

let cacheData = [];
let queueData = {};

const typeDefs = gql`
  type Query {
    getMasks: MaskDataPayload
    quote: String
  }
  type Mutation @rateLimit(limit: 30, duration: 30) {
    updateQueueNumber(code: String, number: Int): UpdateQueueNumberPayload
    quote: String
  }
  type MaskDataPayload {
    payload(code: String): [Mask]
    total: Int
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
    queue_number: Int
    updated_at: String
  }
  type UpdateQueueNumberPayload {
    message: String
    status: String
    errors: [String]
  }
  type Location {
    lat: String
    lon: String
  }
`;

const resolvers = {
  Query: {
    getMasks: (_, args) => {
      const cacheTotal = cacheData.length;
      return {
        payload: cacheData,
        total: cacheTotal,
        status: 200,
        message: "Success",
        errors: null
      };
    },
    quote: () =>
      "The future is something which everyone reaches at the rate of sixty minutes an hour, whatever he does, whoever he is. ― C.S. Lewis"
  },
  Mutation: {
    updateQueueNumber: (_, args) => {
      const { code, number } = args;
      queueData[code] = number;
      return {
        status: 204,
        message: "Success",
        errors: null
      };
    },
    quote: () =>
      "The future is something which everyone reaches at the rate of sixty minutes an hour, whatever he does, whoever he is. ― C.S. Lewis"
  },
  MaskDataPayload: {
    payload: (_, args) => {
      const { code } = args;
      if (code) {
        const result = cacheData.filter(data => data.code === code);
        return result;
      }
      return cacheData;
    }
  }
};

const server = new ApolloServer({
  introspection: true,
  playground: true,
  cors: true,
  typeDefs: [createRateLimitTypeDef(), typeDefs],
  resolvers,
  schemaDirectives: {
    rateLimit: createRateLimitDirective()
  }
});
const app = express();
app.use(compression());

const html = `
<html>
  <head>
    <title>健保特約機構口罩剩餘數量明細清單 - GraphQL/JSON 開放版</title>
    <meta
      property="og:title"
      content="健保特約機構口罩剩餘數量明細清單 - GraphQL/JSON 開放版"
    />
    <meta
      property="og:description"
      content="政府公開資料可直接使用於 website cline 端的 GraphQL/JSON 開放版"
    />
    <meta property="og:image" content="https://i.imgur.com/vu5Gs8d.png" />
    <link
      rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
      integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
      crossorigin="anonymous"
    />
  </head>
  <body>
    <h1 style="text-align: center;">
      健保特約機構口罩剩餘數量明細清單 - GraphQL/JSON 開放版
    </h1>
    <h3 style="text-align: center;">更新頻率：每 1 分鐘整</h3>
    <div style="text-align: center;">
      GraphQL API Endpoint: <a href="/graphql">/graphql</a>
    </div>
    <div style="text-align: center; margin-bottom: 20px;">
      JSON API Endpoint: <a href="/restful/getMasks">/restful/getMasks</a>
    </div>
    <p style="display: flex; justify-content: center;">
      <a
        class="btn btn-primary"
        data-toggle="collapse"
        href="#allMechanism"
        role="button"
        aria-expanded="false"
        aria-controls="allMechanism"
      >
        請求所有機構資訊
      </a>
    </p>
    <div class="collapse" id="allMechanism">
      <div class="card card-body">
        <div style="display: flex; justify-content: space-around;">
          <div>
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

                ## 民眾回報號碼牌號碼
                queue_number

                ## 來源資料時間
                updated_at
              }
              message
              errors
              status
            }
          }
        </pre
            >
          </div>
          <div>
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
                    "queue_number": 15,
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
        </pre
            >
          </div>
        </div>
      </div>
    </div>
    <p style="display: flex; justify-content: center;">
      <a
        class="btn btn-primary"
        data-toggle="collapse"
        href="#singleMechanism"
        role="button"
        aria-expanded="false"
        aria-controls="singleMechanism"
      >
        請求單一機構
      </a>
    </p>
    <div class="collapse" id="singleMechanism">
      <div class="card card-body">
        <div style="display: flex; justify-content: space-around;">
          <div>
            <pre>
          query {
            getMasks {
              payload(code: "2331200010") {
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

                ## 民眾回報號碼牌號碼
                queue_number

                ## 來源資料時間
                updated_at
              }
              message
              errors
              status
            }
          }
        </pre
            >
          </div>
          <div>
            <pre>
          {
            "data": {
              "getMasks": {
                "total": 5593,
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
                    "adult_count": 208,
                    "child_count": 84,
                    "queue_number": null,
                    "updated_at": "2020/02/10 10:10:39"
                  }
                ],
                "message": "Success",
                "errors": null,
                "status": "200"
              }
            }
          }
        </pre
            >
          </div>
        </div>
      </div>
    </div>
    <p  style="display: flex; justify-content: center;">
      <a
        class="btn btn-primary"
        data-toggle="collapse"
        href="#queueUpdate"
        role="button"
        aria-expanded="false"
        aria-controls="queueUpdate"
      >
        請求增加機構排隊號碼(rate limit: 30time/30sec)
      </a>
    </p>
    <div class="collapse" id="queueUpdate">
      <div class="card card-body">
        <div style="display: flex; justify-content: space-around;">
          <div>
            <pre>
            mutation {
              ## code 機構代碼
              ## number 回報號碼牌號碼
              updateQueueNumber(code: "0145080011", number: 30) {
                message
                errors
                status
              }
            }
          </pre
            >
          </div>
          <div>
            <pre>
            {
              "data": {
                "updateQueueNumber": {
                  "message": "Success",
                  "errors": null,
                  "status": "204"
                }
              }
            }
          </pre
            >
          </div>
        </div>
      </div>
    </div>
    <script
      src="https://code.jquery.com/jquery-3.2.1.slim.min.js"
      integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js"
      integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"
      integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl"
      crossorigin="anonymous"
    ></script>
  </body>
</html>
`;
app.get("/", (req, res) => {
  res.status(200).send(html);
});
app.get("/restful/getMasks", (req, res) => {
  res.status(200).send({
    payload: cacheData,
    status: 200,
    message: "Success",
    errors: null
  });
});

server.applyMiddleware({ app });

app.listen(process.env.PORT || 53310, () => {
  console.log("Server is running on port " + process.env.PORT);
});

async function farmer() {
  const maskData = await axios({
    url:
      "http://data.nhi.gov.tw/Datasets/Download.ashx?rid=A21030000I-D50001-001&l=https://data.nhi.gov.tw/resource/mask/maskdata.csv"
  }).then(r => r.data);
  const splitData = maskData.split("\n");
  const newData = [];
  for (let i = 1; i < splitData.length - 2; i++) {
    const code = splitData[i].split(",")[0];
    newData.push({
      code,
      name: splitData[i].split(",")[1],
      address: splitData[i].split(",")[2],
      phone: splitData[i].split(",")[3],
      adult_count: splitData[i].split(",")[4],
      child_count: splitData[i].split(",")[5],
      queue_number: queueData[code] || null,
      updated_at: splitData[i].split(",")[6].replace("\r", "")
    });
  }
  newData.forEach(mask => {
    for (let i = 0; i < points.features.length; i++) {
      if (mask.name === points.features[i].properties.name) {
        mask["location"] = {
          lon: points.features[i].geometry.coordinates[0],
          lat: points.features[i].geometry.coordinates[1]
        };
        mask["business_hours"] = points.features[i].properties.available.split(
          "、"
        );
        break;
      }
    }
  });
  cacheData = newData;
}

var job = new CronJob(
  "* * * * *",
  function() {
    farmer();
  },
  null,
  true
);
job.start();
farmer();
