const fs = require('fs');
const readLine = require('readline');

const col = ' 3-2013';
var arr = [];
var idx = null;
var keyLine = null;
var keyLineIndex = 13;
var sumArr = [];

// States are in same order as given in csv file. If we change the order then code will break.
// have to add more code on that
var state = ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu'];
var stateIdx;
var jsonOilseedData = [];
var jsonFoodgrainsData = [];
var jsonCommercialCropData = [];
var jsonRiceProduction = [];

var readStream = fs.createReadStream('./Production-Department_of_Agriculture_and_Cooperation_1.csv');

var lineReader = readLine.createInterface({
  input: readStream
});

lineReader.on('line',function(line){
  var data = line.split(',');
  keyLine = keyLine || data;
  idx = idx || data.indexOf(col);
  var productionName = data[0];

   //all oilseed crop type vs .production
   if(productionName.indexOf('Oilseeds') !== -1 && data[idx + 1] !== 'NA'){
     jsonOilseedData.push({'Particulars' : productionName , '3-2013' : data[idx + 1]});
   }

   //all the Foodgrains type vs. production
   if(productionName.indexOf('Foodgrains') !== -1 && data[idx + 1] !== 'NA'){
     jsonFoodgrainsData.push({'Particulars' : productionName , '3-2013' : data[idx + 1]});
   }

   //Aggregate all commercial crops
   if(productionName.indexOf('Commercial') !== -1){
      var i = 0;
      data.forEach(function(elem, index){
        sumArr[i] = sumArr[i] || 0;
        if(index > 13){
          if(elem == 'NA')
            elem = 0;

          sumArr[i] += parseInt(elem);
          i++;
        }
      })
    }

    //stacked chart of rice production
    if(productionName.indexOf('Rice Yield') !== -1){
      var tempState = 0;
      var tempObj = {};
      var keyLineIndex = 13;
      stateIdx = stateIdx || 0;
      data.forEach(function(elem, index){
        if(index > 13){
            if(elem == 'NA')
              elem = 0;

            if(productionName.indexOf(state[stateIdx]) !== -1){
              if(!tempObj.hasOwnProperty('Particulars')){
                tempObj['Particulars'] = state[stateIdx];
              }
              if(!tempObj.hasOwnProperty('total')){
                tempObj['total'] = 0;
              }
              var key = keyLine[keyLineIndex];
              tempObj[key] = parseInt(elem);
              tempObj['total'] += parseInt(elem);
              keyLineIndex += 1;
            }
        }
      });
      if(productionName.indexOf(state[stateIdx]) !== -1){
        jsonRiceProduction.push(tempObj);
        stateIdx += 1;
      }
    }
})

lineReader.on('close', function(){
    //Sorting
    jsonOilseedData.sort(function(a,b){
      if(a['3-2013'] == b['3-2013']){
        return 0;
      }else {
        return parseInt(a['3-2013']) > parseInt(b['3-2013']) ? -1 : 1;
      }
    });

    jsonFoodgrainsData.sort(function(a,b){
      if(a['3-2013'] == b['3-2013']){
        return 0;
      }else {
        return parseInt(a['3-2013']) > parseInt(b['3-2013']) ? -1 : 1;
      }
    });

    /// all commercial crops and plot the aggregated value vs. year
    sumArr.forEach(function(elem, index){
      var year = keyLine[keyLineIndex].slice(3,7);
      jsonCommercialCropData.push({
        'Year' : year,
        'aggregateVal' :  elem/5
      });
      keyLineIndex += 1;
    })

    jsonCommercialCropData.sort(function(a,b){
      if(a.aggregateVal == b.aggregateVal){
        return 0;
      }else {
        return a.aggregateVal > b.aggregateVal ? 1 : -1;
      }
    })

    //Creating JSON file for each
    fs.writeFileSync('jsonData/OilseedData.json', JSON.stringify(jsonOilseedData), encoding='utf-8');
    fs.writeFileSync('jsonData/FoodgrainData.json', JSON.stringify(jsonFoodgrainsData), encoding='utf-8');
    fs.writeFileSync('jsonData/ComercialCropsData.json', JSON.stringify(jsonCommercialCropData), encoding='utf-8');
    fs.writeFileSync('jsonData/StateRiceProductionData.json', JSON.stringify(jsonRiceProduction), encoding='utf-8');
})
