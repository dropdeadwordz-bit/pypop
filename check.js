/* Prüft Code-Aufgaben (Spiegelbild von passes() in tools/build_content.py)
   und übersetzt Python-Fehler in verständliches Deutsch. */

export function norm(s) {
  const lines = String(s || "").replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+$/, ""));
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

const ASSIGN = /^\s*[A-Za-z_]\w*\s*(\+|-|\*|\/)?=(?!=)/gm;

export function checkCode(check, code, res, tpl) {
  if (res.err) return { ok: false, reason: "error" };
  const out = norm(res.out);
  if (check.exact != null) {
    const exp = norm(tpl(check.exact));
    if (out !== exp) return { ok: false, reason: "exact", expected: exp };
  }
  for (const s of check.includes || []) {
    const t = tpl(s);
    if (!out.toLowerCase().includes(t.toLowerCase())) {
      return { ok: false, reason: "text", msg: `Deine Ausgabe sollte „${t}“ enthalten.` };
    }
  }
  const flat = code.replace(/\s+/g, "");
  for (const s of check.codeIncludes || []) {
    const t = tpl(s);
    if (!flat.includes(t.replace(/\s+/g, ""))) {
      return { ok: false, reason: "text", msg: `Dein Code sollte „${t}“ verwenden.` };
    }
  }
  const lines = out.split("\n").filter((l) => l.trim()).length;
  if (lines < (check.minLines || 0)) {
    return {
      ok: false,
      reason: "text",
      msg: lines === 0
        ? "Dein Programm zeigt noch nichts an. Fehlt ein print – oder ist ein String leer?"
        : `Deine Ausgabe braucht mindestens ${check.minLines} Zeilen. Gerade sind es ${lines}.`,
    };
  }
  const assigns = (code.match(ASSIGN) || []).length;
  if (assigns < (check.minAssign || 0)) {
    return { ok: false, reason: "text", msg: `Lege mindestens ${check.minAssign} Variablen an.` };
  }
  return { ok: true };
}

export function explainError(err) {
  if (!err) return null;
  const { type, msg = "", line } = err;
  const where = line ? ` in Zeile ${line}` : "";
  if (type === "Timeout") {
    return { title: "Zu lange gelaufen", text: "Dein Programm hat nach 6 Sekunden nicht aufgehört. Vielleicht eine Endlosschleife?" };
  }
  if (type === "InternalError") {
    return { title: "Python hatte ein Problem", text: "Versuch es einfach noch einmal." };
  }
  let text = "";
  if (type === "SyntaxError") {
    if (/unterminated string/.test(msg)) text = "Ein Text ist nicht geschlossen: Es fehlt ein Anführungszeichen.";
    else if (/was never closed/.test(msg)) text = "Eine Klammer wurde geöffnet, aber nicht geschlossen.";
    else if (/unmatched/.test(msg)) text = "Hier ist eine Klammer zu viel.";
    else if (/Missing parentheses in call to 'print'/.test(msg)) text = "Bei print fehlen die Klammern: print(...)";
    else if (/expected ':'/.test(msg)) text = "Am Ende der Zeile fehlt ein Doppelpunkt.";
    else if (/invalid character/.test(msg)) text = "Hier steht ein Zeichen, das Python nicht kennt – zum Beispiel „schöne“ Anführungszeichen statt \" \".";
    else if (/invalid decimal literal/.test(msg)) text = "Ein Name darf nicht mit einer Ziffer beginnen. Oder zwischen Zahl und Buchstabe fehlt ein Rechenzeichen.";
    else if (/cannot assign to/.test(msg)) text = "Links vom = muss ein gültiger Variablenname stehen – ohne Leerzeichen und Bindestriche.";
    else if (/forgot a comma/.test(msg)) text = "Python versteht diese Zeile nicht. Fehlt ein Komma, eine Klammer oder ein Anführungszeichen?";
    else text = "Die Schreibweise stimmt nicht. Prüfe Klammern, Anführungszeichen und Doppelpunkte.";
  } else if (type === "IndentationError") {
    if (/unexpected indent/.test(msg)) text = "Diese Zeile ist eingerückt, obwohl sie es nicht sein sollte. Lösche die Leerzeichen am Anfang.";
    else if (/expected an indented block/.test(msg)) text = "Nach einem Doppelpunkt muss die nächste Zeile eingerückt sein.";
    else text = "Die Einrückung passt nicht zu den Zeilen darüber.";
  } else if (type === "NameError") {
    const m = msg.match(/name '(.+?)' is not defined/);
    const n = m ? m[1] : "";
    if (/^print$/i.test(n)) text = "Python unterscheidet Groß- und Kleinschreibung: print, nicht " + n + ".";
    else text = `Python kennt „${n}“ nicht. Ein Tippfehler? Oder fehlen Anführungszeichen um einen Text?`;
  } else if (type === "TypeError") {
    if (/can only concatenate str|unsupported operand type\(s\) for \+.*str/.test(msg)) text = "Text und Zahl lassen sich nicht mit + verbinden. Wandle die Zahl mit str() um.";
    else if (/can't multiply sequence/.test(msg)) text = "Text kann nur mit einer ganzen Zahl malgenommen werden.";
    else if (/unsupported operand/.test(msg)) text = "Mit Text kann Python so nicht rechnen. Ist eine Zahl in Anführungszeichen?";
    else text = "Hier passen die Arten der Werte nicht zusammen, zum Beispiel Text und Zahl.";
  } else if (type === "ValueError") {
    if (/invalid literal for int/.test(msg)) text = "int() kann diesen Text nicht in eine Zahl umwandeln.";
    else text = "Ein Wert passt hier nicht.";
  } else if (type === "ZeroDivisionError") {
    text = "Durch 0 teilen geht nicht – auch nicht in Python.";
  } else {
    text = "Lies die Meldung unten genau – sie verrät, was schiefging.";
  }
  return { title: `${type}${where}`, text, raw: `${type}: ${msg}` };
}
