const masks = require('./info/maskdata.json')
const points = require('./info/points.json')
const axios = require('axios')

masks.data.getMasks.payload.forEach(mask => {
  for(let i = 0; i < points.features.length; i++) {
    if (mask.name === points.features[i].properties.name) {
      mask['location'] = {
        lan: points.features[i].geometry.coordinates[0],
        lat: points.features[i].geometry.coordinates[1],
      }
      break;
    }
  }
})

console.log(masks.data.getMasks.payload[0])