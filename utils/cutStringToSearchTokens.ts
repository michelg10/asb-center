export function cutStringToSearchTokens(s: string) {
  if (s.length===0) {
    return [];
  }
  // cut s into "search tokens. basically anything that's not a character or a number is taken as a space and everything separated by spaces is a search token.
  s=s.toLowerCase();
  let isImportantCharacter = (c: string) => {return c>='a'&&c<='z'||c>='0'&&c<='9'||c.charCodeAt(0)>127};
  let rturn: string[]=[];
  let tmp = "";
  for (let i=0;i<s.length;i++) {
    if (isImportantCharacter(s[i])) {
      tmp+=s[i];
    } else {
      if (tmp.length>0) {
        rturn.push(tmp);
        tmp="";
      }
    }
  }
  if (tmp.length>0) {
    rturn.push(tmp);
  }
  return rturn;
}