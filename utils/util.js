const getUnixTime = () => {
  return Math.floor(Date.now() / 1000);
}
const getTimeDifference = (from, to) => {
  return `${from-to} utt`;
}
const withinRange = (number, rangeL, rangeR) => {
  let inRange=true;
  if (rangeL !== -1) {
    if (number < rangeL) {
      inRange=false;
    }
  } else if (rangeR !== -1) {
    if (number > rangeR) {
      inRange=false;
    }
  }
  return inRange;
}

module.exports = {
  getUnixTime,
  getTimeDifference,
  withinRange
}
