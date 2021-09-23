const getUnixTime = () => {
  return Math.floor(Date.now() / 1000);
}
const getTimeDifference = (fromTs, toTs) => {
  let diff=fromTs-toTs;
  let rturn="";
  let diffPositive = (diff>0);
  if (diff<0) {
    rturn="in ";
    diff=-diff;
  }
  if (diff<60) {
    return "now";
  }
  diff/=60;
  if (diff<60) {
    rturn+=`${Math.floor(diff)}m`;
  }
  diff=diff/60;
  if (diff<24&&diff>1) {
    rturn+=`${Math.floor(diff)}hr`;
  }
  diff/=24;
  if (diff<365&&diff>1) {
    rturn+=`${Math.floor(diff)}d`;
  }
  diff/=365;
  if (diff>1) {
    rturn+=`${Math.floor(diff)}yrs`;
  }
  if (diffPositive) {
    rturn+=' ago';
  }
  return rturn;
}
const withinRange = (number, rangeL, rangeR) => {
  let inRange=true;
  if (rangeL !== -1) {
    if (number < rangeL) {
      inRange=false;
    }
  }
  if (rangeR !== -1) {
    if (number > rangeR) {
      inRange=false;
    }
  }
  return inRange;
}

const extendNumberToLengthString = (number, length) => {
  let numberString = number.toString();
  if (numberString.length<length) {
    let result="";
    for (let i=0;i<length-numberString.length;i++) {
      result+="0";
    }
    result+=numberString;
    return result;
  } else {
    return numberString;
  }
}

module.exports = {
  getUnixTime,
  getTimeDifference,
  withinRange,
  extendNumberToLengthString
}
