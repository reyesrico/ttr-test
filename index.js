var rotations = null;
var spots = null;

var rotationsIn = document.getElementById("rotationsIn");
var spotsIn = document.getElementById("spotsIn");

function renderRotations(event) {
  let file = event.files[0];
  var reader = new FileReader();
  
  reader.addEventListener('load', function (e) {
    rotations = renderData(e.target.result);
  });
  reader.readAsText(file);
}

function renderSpots(event) {
  let file = event.files[0];
  var reader = new FileReader();
  
  reader.addEventListener('load', function (e) {
    spots = renderData(e.target.result);
  });  
  reader.readAsText(file);
}   

function renderData(data) {
  const [headersLine, ...lines] = data.split(/\r?\n/);
  const headers = headersLine.split('\"').join('').split(',');
  lines.pop();

  return lines.map(line => {
    return line.split('\"').join('').split(',').reduce((object, value, index) => {
      const header = headers[index];
      return {...object, [header]: value};
      },
    {});
  });
}

function byCreatives() {
  return spots.reduce((acc, val) => {
    let index = acc.findIndex(a => a.Creative === val.Creative);
    if (index < 0) {
      let Spend = parseFloat(val.Spend).toFixed(2);
      let Views = parseInt(val.Views);
      let CPV = parseFloat(Spend/Views).toFixed(2);
      acc.push({ Creative: val.Creative, Spend, Views, CPV });
    } else {
      let curVal = acc[index];
      let Spend = (parseFloat(curVal.Spend)+ parseFloat(val.Spend)).toFixed(2);
      let Views = parseInt(curVal.Views) + parseInt(val.Views);
      let CPV = parseFloat(Spend/Views).toFixed(2);
      acc[index] = { Creative: val.Creative, Spend, Views, CPV };
    }
    return acc;
  }, []);
}

function byDayRotation() {
  let map = {};
  spots.forEach(spot => {
    let rotationNames = getRotationNames(spot.Time);
    rotationNames.forEach(name => {
      let key = `${spot.Date} ${name}`;
      if (Object.keys(map).includes(key)) {
        let val = map[key];
        let Spend = (parseFloat(spot.Spend)+ parseFloat(val.Spend)).toFixed(2);
        let Views = parseInt(spot.Views) + parseInt(val.Views);
        let CPV = parseFloat(Spend/Views).toFixed(2);  
        map[key] = { Spend, Views, CPV };
      } else {
        let Spend = parseFloat(spot.Spend).toFixed(2);
        let Views = parseInt(spot.Views);
        let CPV = parseFloat(Spend/Views).toFixed(2);  
        map = { ...map, [key]: { Spend, Views, CPV }};
      }
    });
  });
  return map;
}

function getRotationNames(timeStr) {
  let time = renderTime(timeStr);
  let rotationNames = [];
  rotations.forEach(rotation => {
    let start = renderTime(rotation.Start);
    let end = renderTime(rotation.End);

    if (time >= start && time <= end) {
      rotationNames.push(rotation.Name.toUpperCase());
    }
  });
  return rotationNames;
}

function renderTime(timeStr) {
  let [time, ampm] = timeStr.split(' ');
  let [hourTemp, minuteTemp] = time.split(':');
  let hour = getRealHour(hourTemp, ampm);
  let minute = parseInt(minuteTemp);
  let currentTime = new Date();
  currentTime.setHours(parseInt(hour), parseInt(minute));
  return currentTime;
}

function getRealHour(hourTemp, ampm) {
  let hour = parseInt(hourTemp);
  if (ampm === 'AM' && hour === 12) {
    return 0;
  } else if (ampm === 'PM' && hour === 12) {
    return 12;
  } else {
    return ampm === 'PM' ? hour+12 : hour;
  }
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
})

function renderTotals() {
  return spots.reduce((acc, s) => {
    let Spend = parseFloat(parseFloat(acc.Spend) + parseFloat(s.Spend)).toFixed(2);
    return {
      Total: acc.Total+1,
      Spend,
      Views: acc.Views+parseInt(s.Views)
    };
  }, { Total: 0, Spend: 0, Views: 0 });
}

function loadInfo() {
  console.log('loadInfo');
  console.log(spots);
  console.log(rotations);
  if (spots && rotations) {
    // Render Totals
    let totals = renderTotals();
    let tSpots = document.getElementById('totalSpots');
    tSpots.innerHTML = totals.Total;
    let tSpend = document.getElementById('totalSpend');
    tSpend.innerHTML = formatter.format(totals.Spend);
    let tViews = document.getElementById('totalViews');
    tViews.innerHTML = totals.Views;

    // Render Creative
    let tableCreative = document.getElementById('creative');
    const creatives = byCreatives();
    let row = document.createElement('tr');
    row.className = "report__row-header"; 
    Object.keys(creatives[0]).forEach(key => {
    row.insertCell().innerHTML = key;
    });
    tableCreative.appendChild(row);
    creatives.forEach(c => {
      row = document.createElement('tr');
      row.className = "report__row-value";
      row.insertCell().innerHTML = c.Creative;
      row.insertCell().innerHTML = formatter.format(c.Spend);
      row.insertCell().innerHTML = c.Views;
      row.insertCell().innerHTML = formatter.format(c.CPV);
      tableCreative.appendChild(row);
    });

    // Render Rotation
    let tableRotation = document.getElementById('rotation');
    const mapRotation = byDayRotation();
    row = document.createElement('tr');
    row.className = "report__row-header"; 
    row.insertCell().innerHTML = 'Day - Rotation';
    row.insertCell().innerHTML = 'Spend';
    row.insertCell().innerHTML = 'Views';
    row.insertCell().innerHTML = 'CPV';
    tableRotation.appendChild(row);
    Object.keys(mapRotation).forEach(o => {
      let dayRotationObject = mapRotation[o];
      row = document.createElement('tr');
      row.className = "report__row-value";
      row.insertCell().innerHTML = o;
      row.insertCell().innerHTML = formatter.format(dayRotationObject.Spend);
      row.insertCell().innerHTML = dayRotationObject.Views;
      row.insertCell().innerHTML = formatter.format(dayRotationObject.CPV);
      tableRotation.appendChild(row);
    });
  }
}
