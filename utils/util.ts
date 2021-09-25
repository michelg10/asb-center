export function getUnixTime() {
  return Math.floor(Date.now() / 1000);
}
export function getTimeDifference(fromTs: number, toTs: number) {
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
export function withinRange(number: number, rangeL: number, rangeR: number) {
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

export function extendNumberToLengthString(number: number, length: number) {
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
