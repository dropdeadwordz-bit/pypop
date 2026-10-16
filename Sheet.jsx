import { useBackLayer } from "../lib/back.js";
import { IconClose } from "./Icons.jsx";

/** Unteres Fenster (Bottom Sheet), schließt auch mit der Zurück-Taste */
export default function Sheet({ open, onClose, title, children, className = "" }) {
  useBackLayer(open, () => {
    onClose();
    return false;
  });
  if (!open) return null;
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className={"sheet " + className}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Schließen"><IconClose /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
