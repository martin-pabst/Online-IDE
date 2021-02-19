export function hash(s: string){
    let hash: number = 0;
    let chr: number;
    for (let i = 0; i < s.length; i++) {
      chr   = s.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export function escapeHtml(unsafe: string): string {
  return unsafe
      .replace(/['"]+/g, '')
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
}

export function dateToString(date: Date): string{
  return `${twoDez(date.getDate())}.${twoDez(date.getMonth() + 1)}.${date.getFullYear()}, ${twoDez(date.getHours())}:${twoDez(date.getMinutes())}`;
}

export function dateToStringWithoutTime(date: Date): string{
  return `${twoDez(date.getDate())}.${twoDez(date.getMonth())}.${date.getFullYear()}`;
}

function twoDez(z: number):string {
  if(z < 10) return "0" + z;
  return "" + z;
}

export function stringToDate(text: string): Date {

  let match = text.match(/^(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})$/);

  let date: Date = new Date(Number.parseInt(match[3]), Number.parseInt(match[2]), Number.parseInt(match[1]), Number.parseInt(match[4]), Number.parseInt(match[5]) );

  return date;
}

export function stringWrap(s: string, length: number ): string{
  return s.replace(
    new RegExp(`(?![^\\n]{1,${length}}$)([^\\n]{1,${length}})\\s`, 'g'), '$1\n'
  );
} 

export function formatAsJavadocComment(s: string, indent: number|string = ""): string {
  let indentString = "";

  if(typeof indent == "string"){
    indentString = indent;
  } else {
    for(let i = 0; i < indent; i++){
      indentString += " ";
    }
  }

  s = stringWrap(s, 60);
  if(s.length > 0) s = "\n" + s;
  s = indentString + "/**" + s.replace(/\n/g, "\n" + indentString + " * ") + "\n" + indentString + " */";
  return s;
}