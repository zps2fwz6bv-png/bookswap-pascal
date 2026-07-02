import React, { useState, useEffect, useMemo } from 'react';

// ── CONFIGURAZIONE ────────────────────────────────────────────────────────────
const DOMINIO = 'pascalgiaveno.it';
const EDITORS = ['federico.ponti@pascalgiaveno.it'];
const PWD_EDITOR = 'venditalibripascal';
// ─────────────────────────────────────────────────────────────────────────────

const MATERIE = ['Diritto',"Disegno e Storia dell'Arte",'Economia Politica',
  'Relazioni internazionali','Economia Aziendale','Filosofia','Storia','Geostoria',
  'Geografia AFM','Fisica','Francese','Francese CONV','Informatica','Inglese',
  'Inglese CONV','Italiano','Latino','Matematica','Religione Cattolica',
  'Scienze Motorie','Scienze Naturali','Sostegno','Tedesco','Tedesco CONV'];

const CONDIZIONI = [
  {v:'mai-usato',l:'Mai usato'},{v:'matita',l:'Sottolineato a matita'},
  {v:'penna',l:'Scritto a penna'},{v:'evidenziato',l:'Evidenziato'},
  {v:'rovinato',l:'Rovinato'}];

const ANNI = ['Prima','Seconda','Terza','Quarta','Quinta'];

const PILL = {
  'mai-usato':'#dcfce7:#166534:#bbf7d0',
  'matita':'#e0f2fe:#0c4a6e:#bae6fd',
  'penna':'#fef9c3:#713f12:#fde68a',
  'evidenziato':'#f3e8ff:#581c87:#e9d5ff',
  'rovinato':'#ffe4e6:#9f1239:#fecdd3'
};

// ── Firebase Realtime Database ─────────────────────────────────────────────────
const FB_URL = 'https://libri-vendita-default-rtdb.europe-west1.firebasedatabase.app';

let ultimoErroreFB = '';

async function fbLeggi(nodo) {
  try {
    const r = await fetch(`${FB_URL}/${nodo}.json`);
    if (!r.ok) {
      let dettaglio = '';
      try { dettaglio = await r.text(); } catch {}
      ultimoErroreFB = `HTTP ${r.status} su /${nodo}.json${dettaglio ? ' — ' + dettaglio.slice(0, 200) : ''}`;
      return null;
    }
    const j = await r.json();
    return Array.isArray(j) ? j : j ? Object.values(j) : [];
  } catch (e) {
    ultimoErroreFB = `Errore di rete su /${nodo}.json: ${e.message}`;
    return null;
  }
}

async function fbScrivi(nodo, data) {
  try {
    const r = await fetch(`${FB_URL}/${nodo}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) {
      let dettaglio = '';
      try { dettaglio = await r.text(); } catch {}
      ultimoErroreFB = `HTTP ${r.status} su /${nodo}.json${dettaglio ? ' — ' + dettaglio.slice(0, 200) : ''}`;
    }
    return r.ok;
  } catch (e) {
    ultimoErroreFB = `Errore di rete su /${nodo}.json: ${e.message}`;
    return false;
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function uid(p){return p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);}
function emailOk(e){return new RegExp(`^[a-z]+\\.[a-z]+@${DOMINIO.replace('.','\\.')}$`,'i').test(e.trim());}
function fmtP(v){const n=Number(v);return(isNaN(n)||v==='')?'':n.toLocaleString('it-IT',{maximumFractionDigits:2})+' €';}
function condL(v){return CONDIZIONI.find(c=>c.v===v)?.l||v;}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafaf9;color:#1c1917;-webkit-font-smoothing:antialiased;}
button{cursor:pointer;border:none;background:none;font-family:inherit;}
input,select{font-family:inherit;}
.app{min-height:100vh;display:flex;flex-direction:column;}
.hdr{background:#fff;border-bottom:1px solid #e7e5e4;position:sticky;top:0;z-index:10;}
.hdr-in{max-width:720px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;}
.hdr-l{display:flex;align-items:center;gap:8px;min-width:0;}
.hdr-title{font-size:15px;font-weight:600;}
.eb{font-size:10px;font-weight:600;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:999px;}
.hdr-r{display:flex;align-items:center;gap:4px;flex-shrink:0;}
.ibtn{padding:8px;border-radius:8px;color:#78716c;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.ibtn:hover{background:#f5f5f4;color:#1c1917;}
.ibtn.rel{position:relative;}
.dot{position:absolute;top:6px;right:6px;width:7px;height:7px;background:#ef4444;border-radius:50%;}
.pbtn{background:#1c1917;color:#fff;font-size:13px;font-weight:500;padding:8px 14px;border-radius:8px;display:flex;align-items:center;gap:4px;transition:background .15s;}
.pbtn:hover{background:#292524;}
.pbtn:disabled{opacity:.6;}
.main{max-width:720px;margin:0 auto;width:100%;padding:16px;flex:1;}
.toast{position:fixed;top:60px;left:50%;transform:translateX(-50%);background:#1c1917;color:#fff;font-size:13px;padding:8px 18px;border-radius:999px;z-index:100;pointer-events:none;white-space:nowrap;}
.filters{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
.sw{position:relative;}
.sw svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;}
.sinp{width:100%;padding:9px 12px 9px 34px;border:1px solid #e7e5e4;border-radius:8px;font-size:14px;background:#fff;outline:none;}
.sinp:focus{box-shadow:0 0 0 2px #d6d3d1;}
.frow{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.sel{width:100%;font-size:12px;padding:8px 4px;border:1px solid #e7e5e4;border-radius:8px;background:#fff;outline:none;color:#44403c;}
.sel:focus{box-shadow:0 0 0 2px #d6d3d1;}
.grid{display:grid;grid-template-columns:1fr;gap:12px;}
@media(min-width:520px){.grid{grid-template-columns:1fr 1fr;}}
.card{background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;}
.ct{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
.ctitle{font-size:14px;font-weight:600;line-height:1.35;word-break:break-word;}
.csub{font-size:12px;color:#78716c;margin-top:2px;}
.canni{font-size:11px;color:#a8a29e;margin-top:2px;}
.cprice{font-size:14px;font-weight:700;white-space:nowrap;}
.cact{display:flex;align-items:center;gap:4px;flex-shrink:0;}
.tbtn{padding:4px;border-radius:6px;color:#d4d0cb;transition:color .15s;}
.tbtn:hover{color:#ef4444;}
.cbtn{display:flex;gap:2px;}
.cy{font-size:11px;color:#dc2626;font-weight:500;padding:3px 6px;border-radius:5px;}
.cy:hover{background:#fef2f2;}
.cn{font-size:11px;color:#a8a29e;padding:3px 6px;border-radius:5px;}
.cn:hover{background:#f5f5f4;}
.pill{display:inline-flex;font-size:11px;font-weight:500;padding:2px 8px;border-radius:999px;border:1px solid;}
.cfoot{border-top:1px solid #f5f5f4;padding-top:10px;}
.cseller{font-size:12px;color:#78716c;margin-bottom:8px;}
.rbtn{font-size:12px;font-weight:500;background:#1c1917;color:#fff;padding:6px 12px;border-radius:8px;transition:background .15s;}
.rbtn:hover{background:#292524;}
.rbtn:disabled{opacity:.6;}
.swait{display:flex;align-items:center;gap:5px;font-size:12px;color:#b45309;}
.tlink{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:#15803d;text-decoration:none;}
.srif{font-size:12px;color:#a8a29e;}
.empty{text-align:center;padding:60px 16px;border:1.5px dashed #d6d3d1;border-radius:12px;}
.et{font-size:14px;font-weight:500;color:#57534e;margin:12px 0 4px;}
.es{font-size:12px;color:#a8a29e;}
.errbar{background:#fff1f2;border:1px solid #fecdd3;color:#9f1239;font-size:13px;border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;}
.errbar button{font-size:12px;text-decoration:underline;color:#9f1239;font-weight:500;}
/* Pagina fullscreen mobile, modale desktop */
.pov{display:none;}
.pwrap{background:#fff;width:100%;min-height:100vh;display:flex;flex-direction:column;}
@media(min-width:520px){
  .pov{display:block;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:40;}
  .pwrap{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:transparent;min-height:0;}
  .pinner{max-height:88vh;border-radius:16px;overflow:hidden;width:100%;max-width:460px;}
}
.pinner{background:#fff;width:100%;min-height:100vh;display:flex;flex-direction:column;}
@media(min-width:520px){.pinner{min-height:0;}}
.phead{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #f5f5f4;position:sticky;top:0;background:#fff;z-index:5;}
.pbk{padding:6px;border-radius:8px;color:#78716c;display:flex;}
.pbk:hover{background:#f5f5f4;color:#1c1917;}
.phtxt{flex:1;min-width:0;}
.phtitle{font-size:15px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pbody{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.bcnt{background:#ef4444;color:#fff;font-size:11px;font-weight:600;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
/* Accesso */
.acc{min-height:100vh;background:#fafaf9;display:flex;align-items:center;justify-content:center;padding:20px;}
.abox{width:100%;max-width:340px;}
.alogo{text-align:center;margin-bottom:24px;}
.atitle{font-size:18px;font-weight:600;margin-top:10px;}
.asub{font-size:13px;color:#78716c;margin-top:4px;}
.inp{width:100%;font-size:14px;padding:10px 12px;border:1px solid #e7e5e4;border-radius:8px;outline:none;background:#fff;}
.inp:focus{box-shadow:0 0 0 2px #d6d3d1;}
.fstack{display:flex;flex-direction:column;gap:10px;}
.anote{font-size:11px;color:#a8a29e;text-align:center;margin-top:16px;line-height:1.5;}
.etxt{font-size:12px;color:#dc2626;}
.eal{display:flex;align-items:center;gap:8px;font-size:12px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;}
.lbtn{font-size:12px;color:#a8a29e;text-align:center;padding:4px;}
.lbtn:hover{color:#57534e;}
/* Form libro */
.flibro{padding:16px;display:flex;flex-direction:column;gap:16px;}
.campo{display:flex;flex-direction:column;gap:6px;}
.clabel{font-size:12px;font-weight:500;color:#57534e;}
.agrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.abtn{font-size:13px;font-weight:500;padding:10px;border-radius:8px;border:1px solid #e7e5e4;color:#57534e;transition:all .15s;}
.abtn:hover{border-color:#a8a29e;}
.abtn.on{background:#1c1917;color:#fff;border-color:#1c1917;}
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.cbtn2{font-size:13px;font-weight:500;padding:10px 12px;border-radius:8px;border:1px solid #e7e5e4;color:#57534e;text-align:left;transition:all .15s;}
.cbtn2:hover{border-color:#a8a29e;}
.cbtn2.on{background:#1c1917;color:#fff;border-color:#1c1917;}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.fnote{font-size:11px;color:#a8a29e;line-height:1.5;}
.bpub{width:100%;background:#1c1917;color:#fff;font-size:14px;font-weight:600;padding:14px;border-radius:12px;transition:background .15s;}
.bpub:hover{background:#292524;}
.bpub:disabled{opacity:.6;}
/* Richieste */
.rlist{padding:16px;display:flex;flex-direction:column;gap:12px;}
.rcard{border:1px solid #e7e5e4;border-radius:10px;padding:14px;}
.rtitle{font-size:13px;font-weight:600;}
.rsub{font-size:11px;color:#78716c;margin-top:2px;}
.rfoot{display:flex;gap:8px;margin-top:10px;}
.bappr{font-size:12px;font-weight:500;background:#1c1917;color:#fff;padding:7px 12px;border-radius:8px;}
.bappr:disabled{opacity:.6;}
.brif{font-size:12px;font-weight:500;color:#78716c;padding:7px 12px;border-radius:8px;}
.brif:hover{background:#f5f5f4;}
.tiwrap{margin-top:10px;display:flex;flex-direction:column;gap:6px;}
.bcond{font-size:12px;font-weight:500;background:#15803d;color:#fff;padding:7px 12px;border-radius:8px;}
.bann{font-size:12px;color:#a8a29e;padding:7px 8px;border-radius:8px;}
.bann:hover{background:#f5f5f4;}
.atxt{font-size:12px;color:#15803d;display:flex;align-items:center;gap:4px;margin-top:6px;}
.rftxt{font-size:12px;color:#a8a29e;margin-top:6px;}
`;

// ── SVG icone ─────────────────────────────────────────────────────────────────
const I = {
  Book:  ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Plus:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Inbox: ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Out:   ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Search:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Back:  ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Trash: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  Phone: ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.17-1.17a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Clock: ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check: ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Shield:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [utente, setUtente]   = useState(null);
  const [schermo, setSchermo] = useState('lista');
  const [libri, setLibri]     = useState([]);
  const [richieste, setRich]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore]   = useState(false);
  const [errDett, setErrDett] = useState('');
  const [ricerca, setRicerca] = useState('');
  const [fAnno, setFAnno]     = useState('');
  const [fMat, setFMat]       = useState('');
  const [fCond, setFCond]     = useState('');
  const [toast, setToast]     = useState('');
  const [busy, setBusy]       = useState(false);

  useEffect(() => { if (utente) carica(); }, [utente]);

  async function carica() {
    setLoading(true); setErrore(false); setErrDett('');
    const [l, r] = await Promise.all([fbLeggi('libri'), fbLeggi('richieste')]);
    if (l === null || r === null) { setErrore(true); setErrDett(ultimoErroreFB); setLoading(false); return; }
    setLibri(Array.isArray(l) ? l : []);
    setRich(Array.isArray(r) ? r : []);
    setLoading(false);
  }

  function tick(t) { setToast(t); setTimeout(() => setToast(''), 2200); }

  async function pubblica(dati) {
    setBusy(true);
    const libro = { ...dati, id: uid('l'), creato: Date.now(), emailP: utente.email, nomeP: utente.nome };
    const nuovi = [libro, ...libri];
    setLibri(nuovi); // ottimistico
    const ok = await fbScrivi('libri', nuovi);
    if (!ok) { setLibri(libri); setErrore(true); }
    setBusy(false);
    setSchermo('lista');
    tick(ok ? 'Libro pubblicato' : 'Errore nel salvataggio');
  }

  async function rimuovi(id) {
    const nuovi = libri.filter(l => l.id !== id);
    const nuoveR = richieste.filter(r => r.lid !== id);
    setLibri(nuovi); setRich(nuoveR);
    await Promise.all([fbScrivi('libri', nuovi), fbScrivi('richieste', nuoveR)]);
  }

  async function chiediContatto(libro) {
    setBusy(true);
    const nr = { id: uid('r'), lid: libro.id, titolo: libro.titolo,
      eR: utente.email, nR: utente.nome, eP: libro.emailP, nP: libro.nomeP,
      stato: 'attesa', tel: '', creato: Date.now() };
    const nuove = [nr, ...richieste];
    setRich(nuove);
    const ok = await fbScrivi('richieste', nuove);
    if (!ok) { setRich(richieste); setErrore(true); }
    setBusy(false);
    tick(ok ? 'Richiesta inviata' : 'Errore nel salvataggio');
  }

  async function approva(id, tel) {
    setBusy(true);
    const nuove = richieste.map(r => r.id === id ? { ...r, stato: 'ok', tel } : r);
    setRich(nuove);
    await fbScrivi('richieste', nuove);
    setBusy(false);
    tick('Numero condiviso');
  }

  async function rifiuta(id) {
    const nuove = richieste.map(r => r.id === id ? { ...r, stato: 'no' } : r);
    setRich(nuove);
    await fbScrivi('richieste', nuove);
  }

  const lFiltrati = useMemo(() => {
    const t = ricerca.trim().toLowerCase();
    return libri.filter(l => {
      if (t && !(l.titolo.toLowerCase().includes(t) || l.materia.toLowerCase().includes(t))) return false;
      if (fAnno && !(Array.isArray(l.anni) && l.anni.includes(fAnno))) return false;
      if (fMat && l.materia !== fMat) return false;
      if (fCond && l.condizione !== fCond) return false;
      return true;
    });
  }, [libri, ricerca, fAnno, fMat, fCond]);

  const richRic  = useMemo(() => richieste.filter(r => r.eP === utente?.email), [richieste, utente]);
  const attesa   = richRic.filter(r => r.stato === 'attesa').length;
  const richMap  = useMemo(() => {
    const m = {};
    richieste.filter(r => r.eR === utente?.email).forEach(r => { m[r.lid] = r; });
    return m;
  }, [richieste, utente]);

  if (!utente) return <><style>{CSS}</style><Accesso onAccedi={setUtente}/></>;

  if (schermo === 'form') return <>
    <style>{CSS}</style>
    <Pagina titolo="Pubblica un libro" onBack={() => setSchermo('lista')}>
      <FormLibro onSalva={pubblica} busy={busy}/>
    </Pagina>
  </>;

  if (schermo === 'richieste') return <>
    <style>{CSS}</style>
    <Pagina titolo="Richieste ricevute" badge={attesa} onBack={() => setSchermo('lista')}>
      <PannelloRich richieste={richRic} onApprova={approva} onRifiuta={rifiuta} busy={busy}/>
    </Pagina>
  </>;

  return <>
    <style>{CSS}</style>
    <div className="app">
      <header className="hdr">
        <div className="hdr-in">
          <div className="hdr-l">
            <I.Book/>
            <span className="hdr-title">Scambio libri</span>
            {utente.editor && <span className="eb">Editor</span>}
          </div>
          <div className="hdr-r">
            <button className="ibtn rel" onClick={() => setSchermo('richieste')}>
              <I.Inbox/>{attesa > 0 && <span className="dot"/>}
            </button>
            <button className="pbtn" onClick={() => setSchermo('form')}>
              <I.Plus/><span>Pubblica</span>
            </button>
            <button className="ibtn" onClick={() => setUtente(null)}><I.Out/></button>
          </div>
        </div>
      </header>

      {toast && <div className="toast">{toast}</div>}

      <main className="main">
        {errore && <div className="errbar">
          <span>Errore di connessione al database.{errDett && <><br/><span style={{fontSize:11,opacity:.85}}>{errDett}</span></>}</span>
          <button onClick={carica}>Riprova</button>
        </div>}

        <div className="filters">
          <div className="sw"><I.Search/>
            <input className="sinp" type="text" value={ricerca}
              onChange={e => setRicerca(e.target.value)} placeholder="Cerca titolo o materia"/>
          </div>
          <div className="frow">
            <select className="sel" value={fAnno} onChange={e => setFAnno(e.target.value)}>
              <option value="">Tutti gli anni</option>
              {ANNI.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="sel" value={fMat} onChange={e => setFMat(e.target.value)}>
              <option value="">Tutte le materie</option>
              {MATERIE.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="sel" value={fCond} onChange={e => setFCond(e.target.value)}>
              <option value="">Tutte le condizioni</option>
              {CONDIZIONI.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty"><p className="es">Caricamento…</p></div>
        ) : lFiltrati.length === 0 ? (
          <div className="empty">
            <I.Book/>
            <p className="et">{libri.length === 0 ? 'Nessun libro pubblicato' : 'Nessun risultato'}</p>
            <p className="es">{libri.length === 0 ? 'Pubblica il primo libro per iniziare' : 'Prova a cambiare i filtri'}</p>
          </div>
        ) : (
          <div className="grid">
            {lFiltrati.map(l => (
              <Card key={l.id} libro={l} utente={utente}
                richiesta={richMap[l.id]}
                onRimuovi={() => rimuovi(l.id)}
                onRichiedi={() => chiediContatto(l)}
                busy={busy}/>
            ))}
          </div>
        )}
      </main>
    </div>
  </>;
}

// ── Pagina ────────────────────────────────────────────────────────────────────
function Pagina({ titolo, badge, onBack, children }) {
  return <>
    <div className="pov" onClick={onBack}/>
    <div className="pwrap">
      <div className="pinner">
        <div className="phead">
          <button className="pbk" onClick={onBack}><I.Back/></button>
          <div className="phtxt"><div className="phtitle">{titolo}</div></div>
          {badge > 0 && <span className="bcnt">{badge}</span>}
        </div>
        <div className="pbody">{children}</div>
      </div>
    </div>
  </>;
}

// ── Accesso ───────────────────────────────────────────────────────────────────
function Accesso({ onAccedi }) {
  const [nome, setNome]   = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd]     = useState('');
  const [fase, setFase]   = useState('dati');
  const [err, setErr]     = useState('');

  function submitDati(e) {
    e.preventDefault();
    if (!nome.trim()) { setErr('Inserisci nome e cognome.'); return; }
    if (!emailOk(email)) { setErr(`L'email deve essere nel formato nome.cognome@${DOMINIO}`); return; }
    setErr('');
    if (EDITORS.includes(email.trim().toLowerCase())) { setFase('editor'); return; }
    onAccedi({ nome: nome.trim(), email: email.trim().toLowerCase(), editor: false });
  }

  function submitEditor(e) {
    e.preventDefault();
    if (pwd !== PWD_EDITOR) { setErr('Password non corretta.'); return; }
    onAccedi({ nome: nome.trim(), email: email.trim().toLowerCase(), editor: true });
  }

  return <div className="acc">
    <div className="abox">
      <div className="alogo">
        <I.Book/>
        <div className="atitle">Scambio libri</div>
        <div className="asub">{fase === 'dati' ? `Accedi con la tua email @${DOMINIO}` : 'Password editor'}</div>
      </div>
      {fase === 'dati' ? (
        <form onSubmit={submitDati} className="fstack">
          <input className="inp" type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome e cognome" autoFocus/>
          <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={`nome.cognome@${DOMINIO}`}/>
          {err && <p className="etxt">{err}</p>}
          <button type="submit" className="pbtn" style={{justifyContent:'center',padding:'11px'}}>Continua</button>
        </form>
      ) : (
        <form onSubmit={submitEditor} className="fstack">
          <div className="eal"><I.Shield/>Account editor rilevato</div>
          <input className="inp" type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Password editor" autoFocus/>
          {err && <p className="etxt">{err}</p>}
          <button type="submit" className="pbtn" style={{justifyContent:'center',padding:'11px'}}>Accedi come editor</button>
          <button type="button" className="lbtn" onClick={() => { setFase('dati'); setErr(''); setPwd(''); }}>← Torna indietro</button>
        </form>
      )}
      <p className="anote">Il numero di telefono viene condiviso solo con chi approvi esplicitamente.</p>
    </div>
  </div>;
}

// ── Card libro ────────────────────────────────────────────────────────────────
function Card({ libro, utente, richiesta, onRimuovi, onRichiedi, busy }) {
  const [conf, setConf] = useState(false);
  const mio = libro.emailP === utente.email;
  const puoRimuovere = mio || utente.editor;
  const pc = PILL[libro.condizione]?.split(':');
  const pillStyle = pc ? { background: pc[0], color: pc[1], borderColor: pc[2] } : {};

  return <div className="card">
    <div className="ct">
      <div style={{minWidth:0}}>
        <div className="ctitle">{libro.titolo}</div>
        <div className="csub">{libro.materia}{libro.edizione ? ` · ${libro.edizione}` : ''}</div>
        {Array.isArray(libro.anni) && libro.anni.length > 0 &&
          <div className="canni">{libro.anni.join(' · ')}</div>}
      </div>
      <div className="cact">
        {libro.prezzo !== undefined && libro.prezzo !== '' &&
          <span className="cprice">{fmtP(libro.prezzo)}</span>}
        {puoRimuovere && (conf ? (
          <div className="cbtn">
            <button className="cy" onClick={onRimuovi}>✓</button>
            <button className="cn" onClick={() => setConf(false)}>✕</button>
          </div>
        ) : (
          <button className="tbtn" onClick={() => setConf(true)}
            title={utente.editor && !mio ? 'Rimuovi (editor)' : 'Rimuovi'}>
            <I.Trash/>
          </button>
        ))}
      </div>
    </div>

    <span className="pill" style={pillStyle}>{condL(libro.condizione)}</span>

    <div className="cfoot">
      <div className="cseller">{mio ? 'Il tuo annuncio' : `Da ${libro.nomeP}`}</div>
      {!mio && (richiesta ? (
        <div>
          {richiesta.stato === 'ok' ? (
            <a className="tlink" href={`tel:${richiesta.tel}`}><I.Phone/>{richiesta.tel}</a>
          ) : richiesta.stato === 'attesa' ? (
            <span className="swait"><I.Clock/>In attesa di approvazione</span>
          ) : (
            <span className="srif">Richiesta non accettata</span>
          )}
        </div>
      ) : (
        <button className="rbtn" onClick={onRichiedi} disabled={busy}>Richiedi contatto</button>
      ))}
    </div>
  </div>;
}

// ── Pannello richieste ────────────────────────────────────────────────────────
function PannelloRich({ richieste, onApprova, onRifiuta, busy }) {
  const inAttesa = richieste.filter(r => r.stato === 'attesa');
  const decise   = richieste.filter(r => r.stato !== 'attesa').sort((a,b) => b.creato - a.creato);
  if (!richieste.length) return (
    <p style={{textAlign:'center',padding:'48px 16px',fontSize:13,color:'#a8a29e'}}>
      Nessuna richiesta per i tuoi libri.
    </p>
  );
  return <div className="rlist">
    {[...inAttesa, ...decise].map(r =>
      <RCard key={r.id} r={r} onApprova={onApprova} onRifiuta={onRifiuta} busy={busy}/>
    )}
  </div>;
}

function RCard({ r, onApprova, onRifiuta, busy }) {
  const [mostraTel, setMostraTel] = useState(false);
  const [tel, setTel]             = useState('');
  const [err, setErr]             = useState('');

  function approva() {
    if (!tel.trim()) { setErr('Inserisci il numero.'); return; }
    onApprova(r.id, tel.trim());
    setMostraTel(false);
  }

  return <div className="rcard">
    <div className="rtitle">{r.titolo}</div>
    <div className="rsub">{r.nR} · {r.eR}</div>
    {r.stato === 'ok' && <div className="atxt"><I.Check/>Numero condiviso: {r.tel}</div>}
    {r.stato === 'no' && <div className="rftxt">Rifiutata</div>}
    {r.stato === 'attesa' && (mostraTel ? (
      <div className="tiwrap">
        <input className="inp" type="tel" value={tel} onChange={e => setTel(e.target.value)}
          placeholder="Numero da condividere (non salvato)" autoFocus/>
        {err && <p className="etxt" style={{fontSize:11}}>{err}</p>}
        <div style={{display:'flex',gap:8}}>
          <button className="bcond" onClick={approva} disabled={busy}>Condividi</button>
          <button className="bann" onClick={() => setMostraTel(false)}>Annulla</button>
        </div>
      </div>
    ) : (
      <div className="rfoot">
        <button className="bappr" onClick={() => setMostraTel(true)} disabled={busy}>Approva</button>
        <button className="brif" onClick={() => onRifiuta(r.id)} disabled={busy}>Rifiuta</button>
      </div>
    ))}
  </div>;
}

// ── Form pubblica ─────────────────────────────────────────────────────────────
function FormLibro({ onSalva, busy }) {
  const [titolo, setTitolo]       = useState('');
  const [materia, setMateria]     = useState('');
  const [anni, setAnni]           = useState([]);
  const [prezzo, setPrezzo]       = useState('');
  const [edizione, setEdizione]   = useState('');
  const [condizione, setCondizione] = useState('mai-usato');
  const [err, setErr]             = useState('');

  const tog = a => setAnni(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  function submit(e) {
    e.preventDefault();
    if (!titolo.trim()) { setErr('Inserisci il titolo.'); return; }
    if (!materia)       { setErr('Seleziona una materia.'); return; }
    if (!anni.length)   { setErr('Seleziona almeno un anno.'); return; }
    setErr('');
    onSalva({ titolo: titolo.trim(), materia, anni,
      prezzo: prezzo === '' ? '' : Number(prezzo),
      edizione: edizione.trim(), condizione });
  }

  return <form className="flibro" onSubmit={submit}>
    <div className="campo">
      <label className="clabel">Titolo del libro</label>
      <input className="inp" value={titolo} onChange={e => setTitolo(e.target.value)} placeholder="Es. Matematica blu 2.0"/>
    </div>
    <div className="campo">
      <label className="clabel">Materia</label>
      <select className="inp" value={materia} onChange={e => setMateria(e.target.value)}>
        <option value="">Seleziona una materia</option>
        {MATERIE.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
    <div className="campo">
      <label className="clabel">Anno (selezionane anche più di uno)</label>
      <div className="agrid">
        {ANNI.map(a => (
          <button type="button" key={a} className={'abtn' + (anni.includes(a) ? ' on' : '')}
            onClick={() => tog(a)}>{a}</button>
        ))}
      </div>
    </div>
    <div className="row2">
      <div className="campo">
        <label className="clabel">Prezzo (facoltativo)</label>
        <input className="inp" type="number" min="0" step="0.5" value={prezzo}
          onChange={e => setPrezzo(e.target.value)} placeholder="Es. 15"/>
      </div>
      <div className="campo">
        <label className="clabel">Edizione (facoltativo)</label>
        <input className="inp" value={edizione} onChange={e => setEdizione(e.target.value)} placeholder="Es. Zanichelli"/>
      </div>
    </div>
    <div className="campo">
      <label className="clabel">Condizione</label>
      <div className="cgrid">
        {CONDIZIONI.map(c => (
          <button type="button" key={c.v} className={'cbtn2' + (condizione === c.v ? ' on' : '')}
            onClick={() => setCondizione(c.v)}>{c.l}</button>
        ))}
      </div>
    </div>
    <p className="fnote">Il numero di telefono non viene chiesto ora: lo inserirai solo al momento di approvare una richiesta, e non viene salvato.</p>
    {err && <p className="etxt">{err}</p>}
    <button type="submit" className="bpub" disabled={busy}>{busy ? 'Pubblicazione…' : 'Pubblica annuncio'}</button>
  </form>;
}
