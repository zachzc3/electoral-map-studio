(function(){
"use strict";

/* ============================== REAL DATA ============================== */
// name, abbr, ev, House seats (2020-census apportionment), real 2024 pres winner, real senate makeup [countD,countR,countI]
// Verified: sum(ev)=538, sum(house, excl. DC)=435, sum(senate seats)=100, ev===house+2 for every state but DC,
// and the split-adjusted presidential tally below reproduces the real 312-226 2024 result exactly.
const STATES = [
 ["Alabama","AL",9,7,"R",[0,2,0]],["Alaska","AK",3,1,"R",[0,2,0]],
 ["Arizona","AZ",11,9,"R",[2,0,0]],["Arkansas","AR",6,4,"R",[0,2,0]],
 ["California","CA",54,52,"D",[2,0,0]],["Colorado","CO",10,8,"D",[2,0,0]],
 ["Connecticut","CT",7,5,"D",[2,0,0]],["Delaware","DE",3,1,"D",[2,0,0]],
 ["Florida","FL",30,28,"R",[0,2,0]],["Georgia","GA",16,14,"R",[2,0,0]],
 ["Hawaii","HI",4,2,"D",[2,0,0]],["Idaho","ID",4,2,"R",[0,2,0]],
 ["Illinois","IL",19,17,"D",[2,0,0]],["Indiana","IN",11,9,"R",[0,2,0]],
 ["Iowa","IA",6,4,"R",[0,2,0]],["Kansas","KS",6,4,"R",[0,2,0]],
 ["Kentucky","KY",8,6,"R",[0,2,0]],["Louisiana","LA",8,6,"R",[0,2,0]],
 ["Maine","ME",4,2,"D",[0,1,1]],
 ["Maryland","MD",10,8,"D",[2,0,0]],["Massachusetts","MA",11,9,"D",[2,0,0]],
 ["Michigan","MI",15,13,"R",[2,0,0]],["Minnesota","MN",10,8,"D",[2,0,0]],
 ["Mississippi","MS",6,4,"R",[0,2,0]],["Missouri","MO",10,8,"R",[0,2,0]],
 ["Montana","MT",4,2,"R",[0,2,0]],
 ["Nebraska","NE",5,3,"R",[0,2,0]],
 ["Nevada","NV",6,4,"R",[2,0,0]],
 ["New Hampshire","NH",4,2,"D",[2,0,0]],["New Jersey","NJ",14,12,"D",[2,0,0]],
 ["New Mexico","NM",5,3,"D",[2,0,0]],["New York","NY",28,26,"D",[2,0,0]],
 ["North Carolina","NC",16,14,"R",[0,2,0]],["North Dakota","ND",3,1,"R",[0,2,0]],
 ["Ohio","OH",17,15,"R",[0,2,0]],["Oklahoma","OK",7,5,"R",[0,2,0]],
 ["Oregon","OR",8,6,"D",[2,0,0]],["Pennsylvania","PA",19,17,"R",[1,1,0]],
 ["Rhode Island","RI",4,2,"D",[2,0,0]],["South Carolina","SC",9,7,"R",[0,2,0]],
 ["South Dakota","SD",3,1,"R",[0,2,0]],["Tennessee","TN",11,9,"R",[0,2,0]],
 ["Texas","TX",40,38,"R",[0,2,0]],["Utah","UT",6,4,"R",[0,2,0]],
 ["Vermont","VT",3,1,"D",[1,0,1]],["Virginia","VA",13,11,"D",[2,0,0]],
 ["Washington","WA",12,10,"D",[2,0,0]],["West Virginia","WV",4,2,"R",[0,2,0]],
 ["Wisconsin","WI",10,8,"R",[1,1,0]],["Wyoming","WY",3,1,"R",[0,2,0]],
 ["District of Columbia","DC",3,0,"D",[0,0,0]]
];
// Maine/Nebraska: 2 at-large EV tied to the statewide winner, plus 1 EV per congressional district that can split off.
// Shown as a separate callout list (same convention your own reference map used) since a blank US map SVG has
// no congressional-district boundaries to draw them on top of.
const SPLIT_DISTRICTS = {
  ME: {stateEv:2, districts:[{abbr:"ME-1",winner:"D"},{abbr:"ME-2",winner:"R"}]},
  NE: {stateEv:2, districts:[{abbr:"NE-1",winner:"R"},{abbr:"NE-2",winner:"D"},{abbr:"NE-3",winner:"R"}]}
};
const MAP_VIEWBOX = "0 0 1020 593";
// Hand-placed label positions (and, for the 9 small Northeast states, a combined "XX N"
// callout position instead) lifted from a cleanly hand-drawn reference map, rather than
// computed — a curated position beats any generic centering algorithm.
const LABEL_POS = {
  AK:{x:110,y:504,callout:false}, AL:{x:641,y:422,callout:false}, AR:{x:534,y:384,callout:false},
  AZ:{x:182,y:368,callout:false}, CA:{x:55,y:298,callout:false}, CO:{x:297.22601,y:281.55011,callout:false},
  FL:{x:743,y:505,callout:false}, GA:{x:697,y:419,callout:false}, HI:{x:261,y:565,callout:false},
  IA:{x:513,y:224,callout:false}, ID:{x:183,y:162,callout:false}, IL:{x:579,y:261,callout:false},
  IN:{x:630,y:262,callout:false}, KS:{x:434,y:303,callout:false}, KY:{x:666,y:311,callout:false},
  LA:{x:536,y:452,callout:false}, ME:{x:874,y:110,callout:false}, MI:{x:645,y:193,callout:false},
  MN:{x:484,y:129,callout:false}, MO:{x:525,y:306,callout:false}, MS:{x:587,y:428,callout:false},
  MT:{x:270,y:100,callout:false}, NC:{x:763,y:342,callout:false}, ND:{x:405,y:103,callout:false},
  NE:{x:411,y:232,callout:false}, NM:{x:290,y:381,callout:false}, NV:{x:120,y:242,callout:false},
  NY:{x:798,y:167,callout:false}, OH:{x:685,y:248,callout:false}, OK:{x:451,y:370,callout:false},
  OR:{x:88,y:136,callout:false}, PA:{x:764,y:220,callout:false}, SC:{x:745,y:380,callout:false},
  SD:{x:405,y:170,callout:false}, TN:{x:633,y:353,callout:false}, TX:{x:410,y:458,callout:false},
  UT:{x:209,y:265,callout:false}, VA:{x:767,y:294,callout:false}, WA:{x:105,y:62,callout:false},
  WI:{x:561,y:163,callout:false}, WV:{x:730,y:281,callout:false}, WY:{x:290,y:191,callout:false},
  CT:{x:918,y:228,callout:true}, DC:{x:864,y:327,callout:true}, DE:{x:891,y:284,callout:true},
  MA:{x:927,y:164,callout:true}, MD:{x:883,y:305,callout:true}, NH:{x:800,y:58,callout:true},
  NJ:{x:898,y:260,callout:true}, RI:{x:925,y:199,callout:true}, VT:{x:790,y:82,callout:true},
};
// The two congressional districts that visually diverge from their state's own color in a
// typical 2024 map — drawn as a small inset circle right on the shape, same as the reference.
const SPLIT_INSET = {
  ME:{district:"ME-2", cx:889, cy:66, r:14, labelX:880, labelY:75},
  NE:{district:"NE-2", cx:457, cy:236, r:14, labelX:448, labelY:245},
};
// One path, drawn once, containing every small-state leader line as its own subpath.
const LEADER_LINES_D = "m844 62 13 29m-25-5 8 17m49 50 34 3m-41 22 41 12m-57-6 51 33m-72 13 50 22m-58-2 51 26m-55-15 46 33m-79-43 61 61";

/* ============================== STATE ============================== */
let parties = [
  {id:"D", name:"Democratic", abbr:"D", color:"#698DC5", nominee:"Kamala Harris", runningMate:"Tim Walz", homeState:"California", popularVotes:75017613},
  {id:"R", name:"Republican", abbr:"R", color:"#F07763", nominee:"Donald Trump", runningMate:"JD Vance", homeState:"Florida", popularVotes:77302580},
  {id:"I", name:"Independent", abbr:"I", color:"#8b7ab8", nominee:"", runningMate:"", homeState:"", popularVotes:null}
];
let electionMeta = {
  title: "2024 United States presidential election",
  date: "November 5, 2024",
  turnoutPct: 64.3,
  priorNominee: "Joe Biden",
  priorParty: "D"
};
let presidentView = "map"; // "map" | "summary"
let brushStrength = "safe";
let assignments = {};    // abbr -> {party, strength}
let districtAssign = {}; // "ME-1" etc -> partyId
let evOverrides = {};
let included = {};
let selectedState = null;
let houseAssign = {};
let senateAssign = {};

const STRENGTHS = ["safe","likely","lean","tilt"];
const STRENGTH_LABEL = {safe:"Safe",likely:"Likely",lean:"Lean",tilt:"Tilt"};

function initDefaults(){
  STATES.forEach(s=>{
    const abbr=s[1], winner=s[4];
    assignments[abbr] = {party:winner, strength:"safe"};
    included[abbr] = true;
    houseAssign[abbr] = winner;
  });
  Object.values(SPLIT_DISTRICTS).forEach(sd=>{
    sd.districts.forEach(d=>{ districtAssign[d.abbr] = d.winner; });
  });
  STATES.forEach(s=>{
    const abbr=s[1], makeup=s[5];
    const seats=[];
    for(let i=0;i<makeup[0];i++) seats.push("D");
    for(let i=0;i<makeup[1];i++) seats.push("R");
    for(let i=0;i<makeup[2];i++) seats.push("I");
    seats.forEach((p,i)=>{ senateAssign[abbr+"-"+i]=p; });
  });
}

function loadSaved(){
  try{
    const raw = localStorage.getItem("electoral_studio_v2");
    if(!raw) return false;
    const d = JSON.parse(raw);
    parties=d.parties; assignments=d.assignments; districtAssign=d.districtAssign||{};
    evOverrides=d.evOverrides; included=d.included; houseAssign=d.houseAssign; senateAssign=d.senateAssign;
    // backward-compatible: older saves won't have these fields yet
    parties.forEach(p=>{
      if(p.nominee==null) p.nominee="";
      if(p.runningMate==null) p.runningMate="";
      if(p.homeState==null) p.homeState="";
      if(p.popularVotes===undefined) p.popularVotes=null;
    });
    electionMeta = Object.assign({}, electionMeta, d.electionMeta||{});
    return true;
  }catch(e){ return false; }
}
function save(){
  try{
    localStorage.setItem("electoral_studio_v2", JSON.stringify({parties,assignments,districtAssign,evOverrides,included,houseAssign,senateAssign,electionMeta}));
  }catch(e){}
}

function evOf(abbr){
  const s = STATES.find(x=>x[1]===abbr);
  return evOverrides[abbr] != null ? evOverrides[abbr] : s[2];
}
function partyOf(id){ return parties.find(p=>p.id===id); }
// Cycles to the next party after curId in the current party list, wrapping around;
// with no current assignment, starts at the first party.
function nextPartyId(curId){
  if(!parties.length) return null;
  const idx = curId ? parties.findIndex(p=>p.id===curId) : -1;
  return parties[(idx+1) % parties.length].id;
}
function escapeAttr(s){ return String(s).replace(/"/g,"&quot;"); }

/* ============================== TABS ============================== */
let activeTab = "president";
document.getElementById("tabs").addEventListener("click", e=>{
  const b = e.target.closest(".tab-btn"); if(!b) return;
  activeTab = b.dataset.tab;
  document.querySelectorAll(".tab-btn").forEach(x=>x.classList.toggle("active", x===b));
  renderAll();
});

/* ============================== PARTY MANAGER ============================== */
function renderPartyManager(){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<h3>Parties (${parties.length}/6)</h3>`;
  parties.forEach(p=>{
    const row = document.createElement("div"); row.className="party-row";
    row.innerHTML = `
      <input type="color" class="swatch" value="${p.color}">
      <input type="text" class="pname" value="${escapeAttr(p.name)}" placeholder="Party name">
      <input type="text" class="abbr" value="${escapeAttr(p.abbr)}" maxlength="3">
      <button class="icon-btn" title="Remove">&times;</button>`;
    row.querySelector(".swatch").addEventListener("input", e=>{ p.color=e.target.value; save(); renderAll(); });
    row.querySelector(".pname").addEventListener("change", e=>{ p.name=e.target.value||"Party"; save(); renderAll(); });
    row.querySelector(".abbr").addEventListener("change", e=>{ p.abbr=(e.target.value||"?").toUpperCase().slice(0,3); save(); renderAll(); });
    row.querySelector(".icon-btn").addEventListener("click", ()=>{
      if(parties.length<=1) return;
      parties = parties.filter(x=>x.id!==p.id);
      save(); renderAll();
    });
    el.appendChild(row);
  });
  if(parties.length < 6){
    const add = document.createElement("button");
    add.className="add-party-btn"; add.textContent="+ Add party";
    add.addEventListener("click", ()=>{
      const n = parties.length+1;
      const palette = ["#3fb950","#e0a940","#3bc4b0","#c4713b","#b83bc4","#7a8bc4"];
      const id = "P"+Date.now();
      parties.push({id, name:"New Party "+n, abbr:"P"+n, color:palette[n%palette.length]});
      save(); renderAll();
    });
    el.appendChild(add);
  }
  return el;
}

// Optional per-party/global fields that only matter for the Wikipedia-style Summary view —
// left blank they simply don't appear there, and the map/tallies work fine without them.
function renderCandidateDetails(){
  const el = document.createElement("div"); el.className="card";
  el.innerHTML = `<h3>Candidate Details <span style="text-transform:none;font-weight:500">(for Summary view)</span></h3>`;

  const mkField = (labelText, value, onChange, type)=>{
    const wrap = document.createElement("div");
    const lab = document.createElement("div"); lab.className="field-label"; lab.style.margin="8px 0 4px"; lab.textContent=labelText;
    const inp = document.createElement("input");
    inp.className="ev-input"; inp.type=type||"text"; inp.value = value==null?"":value;
    inp.addEventListener("change", e=>{ onChange(type==="number" ? (e.target.value===""?null:+e.target.value) : e.target.value); save(); renderAll(); });
    wrap.appendChild(lab); wrap.appendChild(inp);
    el.appendChild(wrap);
  };

  mkField("Election title", electionMeta.title, v=>electionMeta.title=v);
  mkField("Date", electionMeta.date, v=>electionMeta.date=v);
  mkField("Turnout %", electionMeta.turnoutPct, v=>electionMeta.turnoutPct=v, "number");

  parties.forEach(p=>{
    const hd = document.createElement("div");
    hd.style.cssText = "margin-top:14px;font-weight:700;font-size:.85rem;display:flex;align-items:center;gap:6px";
    hd.innerHTML = `<span class="dot" style="background:${p.color}"></span>${escapeAttr(p.name)}`;
    el.appendChild(hd);
    mkField("Nominee", p.nominee, v=>p.nominee=v);
    mkField("Running mate", p.runningMate, v=>p.runningMate=v);
    mkField("Home state", p.homeState, v=>p.homeState=v);
    mkField("Popular votes", p.popularVotes, v=>p.popularVotes=v, "number");
  });

  mkField("Prior winner's name", electionMeta.priorNominee, v=>electionMeta.priorNominee=v);
  const priorLabel = document.createElement("div"); priorLabel.className="field-label"; priorLabel.style.margin="8px 0 4px"; priorLabel.textContent="Prior winner's party";
  el.appendChild(priorLabel);
  const priorGrid = document.createElement("div"); priorGrid.className="assign-grid";
  parties.forEach(p=>{
    const b = document.createElement("button");
    const picked = electionMeta.priorParty===p.id;
    b.className="assign-btn"+(picked?" picked":"");
    if(picked) b.style.background=p.color;
    b.textContent = p.abbr;
    b.addEventListener("click", ()=>{ electionMeta.priorParty=p.id; save(); renderAll(); });
    priorGrid.appendChild(b);
  });
  el.appendChild(priorGrid);

  return el;
}

/* ============================== TALLY ============================== */
function computeTally(mode){
  const totals = {}; parties.forEach(p=>totals[p.id]=0);
  let grandTotal = 0;
  if(mode==="president"){
    STATES.forEach(s=>{
      const abbr=s[1];
      if(!included[abbr]) return;
      const split = SPLIT_DISTRICTS[abbr];
      if(split){
        const a = assignments[abbr];
        if(a && totals[a.party]!=null){ totals[a.party]+=split.stateEv; grandTotal+=split.stateEv; }
        split.districts.forEach(d=>{
          const p = districtAssign[d.abbr] || d.winner;
          if(totals[p]!=null){ totals[p]+=1; grandTotal+=1; }
        });
      } else {
        const ev = evOf(abbr);
        const a = assignments[abbr];
        if(a && totals[a.party]!=null){ totals[a.party]+=ev; grandTotal+=ev; }
        else grandTotal+=ev;
      }
    });
  } else if(mode==="house"){
    STATES.forEach(s=>{
      const abbr=s[1];
      if(!included[abbr] || abbr==="DC") return;
      grandTotal++;
      const p = houseAssign[abbr];
      if(p && totals[p]!=null) totals[p]++;
    });
  } else if(mode==="senate"){
    Object.keys(senateAssign).forEach(k=>{
      const abbr = k.split("-")[0];
      if(!included[abbr]) return;
      grandTotal++;
      const p = senateAssign[k];
      if(p && totals[p]!=null) totals[p]++;
    });
  }
  return {totals, grandTotal};
}

function renderTally(mode){
  const {totals, grandTotal} = computeTally(mode);
  const wrap = document.createElement("div"); wrap.className="card";
  const labelWrap = document.createElement("div"); labelWrap.className="tally-labels";
  const bar = document.createElement("div"); bar.className="tally-bar";
  parties.forEach(p=>{
    const v = totals[p.id]||0;
    if(v<=0) return;
    const lab = document.createElement("div");
    lab.innerHTML = `<b class="mono" style="color:${p.color}">${v}</b> <span style="color:var(--muted)">${escapeAttr(p.name)}</span>`;
    labelWrap.appendChild(lab);
    const seg = document.createElement("div");
    seg.className="tally-seg mono"; seg.style.background=p.color;
    seg.style.flexGrow = Math.max(v,0.0001);
    seg.textContent = v;
    bar.appendChild(seg);
  });
  wrap.appendChild(labelWrap); wrap.appendChild(bar);
  const cap = document.createElement("div"); cap.className="tally-caption";
  const majority = Math.floor(grandTotal/2)+1;
  cap.textContent = `${majority} to win of ${grandTotal} total`;
  wrap.appendChild(cap);
  return wrap;
}

/* ============================== PRESIDENT TAB (real SVG map) ============================== */
const SVG_NS = "http://www.w3.org/2000/svg";

function renderPresidentLeft(){
  const wrap = document.getElementById("sideLeft"); wrap.innerHTML="";
  const brush = document.createElement("div"); brush.className="card";
  brush.innerHTML = `<h3>Paint Brush</h3>`;
  const srow = document.createElement("div"); srow.className="strength-row";
  STRENGTHS.forEach(st=>{
    const b = document.createElement("button");
    b.className="strength-btn"+(brushStrength===st?" active":"");
    b.textContent = STRENGTH_LABEL[st];
    b.addEventListener("click", ()=>{ brushStrength=st; renderPresidentLeft(); });
    srow.appendChild(b);
  });
  brush.appendChild(srow);
  const hint = document.createElement("div");
  hint.style.cssText="font-size:.78rem;color:var(--muted);margin-top:10px";
  hint.textContent = "Click a state to cycle its winner through your parties, right-click to clear it, double-click for details.";
  brush.appendChild(hint);
  wrap.appendChild(brush);
  wrap.appendChild(renderPartyManager());
  wrap.appendChild(renderCandidateDetails());
  const reset = document.createElement("button");
  reset.className="reset-btn"; reset.textContent="Reset to Real 2024 Result";
  reset.addEventListener("click", ()=>{
    STATES.forEach(s=>{ assignments[s[1]] = {party:s[4], strength:"safe"}; });
    Object.values(SPLIT_DISTRICTS).forEach(sd=>{ sd.districts.forEach(d=>{ districtAssign[d.abbr]=d.winner; }); });
    save(); renderAll();
  });
  wrap.appendChild(reset);
}

function applyStateVisual(el, abbr){
  const inc = included[abbr] !== false;
  el.classList.toggle("excluded", !inc);
  el.classList.toggle("selected", selectedState===abbr);
  const a = assignments[abbr];
  if(inc && a){
    const p = partyOf(a.party);
    if(p){ el.style.fill = p.color; el.dataset.strength = a.strength; }
  } else {
    el.style.fill = "";
    delete el.dataset.strength;
  }
}

function renderPresidentCenter(){
  const c = document.getElementById("center"); c.innerHTML="";
  c.appendChild(renderTally("president"));

  const toggle = document.createElement("div"); toggle.className="view-toggle";
  [["map","Map"],["summary","Summary"],["evedit","Adjust EVs"]].forEach(([id,label])=>{
    const b = document.createElement("button");
    b.className="view-toggle-btn"+(presidentView===id?" active":"");
    b.textContent = label;
    b.addEventListener("click", ()=>{ presidentView=id; renderAll(); });
    toggle.appendChild(b);
  });
  c.appendChild(toggle);

  if(presidentView==="summary"){ renderSummaryView(c); return; }
  if(presidentView==="evedit"){ renderEvEditorView(c); return; }
  renderMapView(c);
}

function renderMapView(c){
  const wrap = document.createElement("div"); wrap.className="mapwrap";
  const svg = document.createElementNS(SVG_NS,"svg");
  svg.setAttribute("viewBox",MAP_VIEWBOX);
  svg.setAttribute("class","usmap");

  function wireHandlers(el, abbr){
    el.addEventListener("click", ()=>{
      if(included[abbr]===false) return;
      const cur = assignments[abbr];
      assignments[abbr] = {party:nextPartyId(cur && cur.party), strength:brushStrength};
      save(); renderAll();
    });
    el.addEventListener("contextmenu", e=>{
      e.preventDefault();
      if(included[abbr]===false) return;
      delete assignments[abbr];
      save(); renderAll();
    });
    el.addEventListener("dblclick", ()=>{ selectedState = abbr; renderAll(); });
  }

  STATES.forEach(s=>{
    const abbr = s[1];
    const d = STATE_PATHS[abbr];
    if(!d) return;
    const path = document.createElementNS(SVG_NS,"path");
    path.setAttribute("d", d);
    const title = document.createElementNS(SVG_NS,"title");
    title.textContent = `${s[0]} — ${evOf(abbr)} EV`;
    path.appendChild(title);
    applyStateVisual(path, abbr);
    wireHandlers(path, abbr);
    svg.appendChild(path);
  });

  // Leader lines for the small Northeast cluster — one static decorative path, hand-drawn
  // to connect each of those states to its callout label position below.
  const leaderLines = document.createElementNS(SVG_NS,"path");
  leaderLines.setAttribute("d", LEADER_LINES_D);
  leaderLines.setAttribute("class","leader-line");
  leaderLines.setAttribute("fill","none");
  svg.appendChild(leaderLines);

  // Electoral-vote labels at hand-placed positions: inline on the shape for normal-sized
  // states, or as a combined "XX N" callout label for the small Northeast cluster.
  const labelLayer = document.createElementNS(SVG_NS,"g");
  labelLayer.setAttribute("class","map-labels");
  STATES.forEach(s=>{
    const abbr = s[1];
    const pos = LABEL_POS[abbr];
    if(!pos) return;
    const text = document.createElementNS(SVG_NS,"text");
    text.setAttribute("x",pos.x); text.setAttribute("y",pos.y);
    text.setAttribute("class","ev-label"+(pos.callout?" callout-label":""));
    text.textContent = pos.callout ? `${abbr} ${evOf(abbr)}` : evOf(abbr);
    labelLayer.appendChild(text);
  });

  // Congressional-district insets (Maine's 2nd, Nebraska's 2nd) — drawn only when that district's
  // winner actually differs from its state's own at-large winner (same rule a real results map
  // uses: no need to call out a district that already matches the color it's sitting on).
  Object.entries(SPLIT_INSET).forEach(([stateAbbr, inset])=>{
    if(included[stateAbbr]===false) return;
    const districtWinner = districtAssign[inset.district] || SPLIT_DISTRICTS[stateAbbr].districts.find(d=>d.abbr===inset.district).winner;
    const stateWinner = assignments[stateAbbr] && assignments[stateAbbr].party;
    if(districtWinner === stateWinner) return;

    const circle = document.createElementNS(SVG_NS,"circle");
    circle.setAttribute("cx",inset.cx); circle.setAttribute("cy",inset.cy); circle.setAttribute("r",inset.r);
    circle.setAttribute("class","district-inset");
    const p = partyOf(districtWinner);
    if(p) circle.style.fill = p.color;
    const dTitle = document.createElementNS(SVG_NS,"title");
    dTitle.textContent = `${inset.district} — 1 EV (congressional district)`;
    circle.appendChild(dTitle);
    circle.addEventListener("click", ()=>{ districtAssign[inset.district]=nextPartyId(districtAssign[inset.district]); save(); renderAll(); });
    circle.addEventListener("contextmenu", e=>{ e.preventDefault(); delete districtAssign[inset.district]; save(); renderAll(); });
    svg.appendChild(circle);
    const dLabel = document.createElementNS(SVG_NS,"text");
    dLabel.setAttribute("x",inset.labelX); dLabel.setAttribute("y",inset.labelY);
    dLabel.setAttribute("class","ev-label district-inset-label");
    dLabel.textContent = "1";
    labelLayer.appendChild(dLabel);
  });

  svg.appendChild(labelLayer);
  wrap.appendChild(svg);
  c.appendChild(wrap);

  // Split-vote controls (Maine / Nebraska congressional districts) — full editable list;
  // only ME-2/NE-2 also get a visual inset on the map above, same as a typical results map.
  const splitRow = document.createElement("div"); splitRow.className="split-votes";
  Object.entries(SPLIT_DISTRICTS).forEach(([stateAbbr, sd])=>{
    sd.districts.forEach(d=>{
      const p = partyOf(districtAssign[d.abbr] || d.winner);
      const chip = document.createElement("button");
      chip.className="split-chip";
      chip.style.background = p ? p.color : "var(--map-empty)";
      chip.title = `${d.abbr} (1 EV, congressional district)`;
      chip.innerHTML = `${d.abbr} <span class="n">1 EV</span>`;
      chip.addEventListener("click", ()=>{ districtAssign[d.abbr]=nextPartyId(districtAssign[d.abbr]||d.winner); save(); renderAll(); });
      chip.addEventListener("contextmenu", e=>{ e.preventDefault(); districtAssign[d.abbr]=d.winner; save(); renderAll(); });
      splitRow.appendChild(chip);
    });
  });
  c.appendChild(splitRow);

  const dbl = document.createElement("div");
  dbl.style.cssText="text-align:center;color:var(--muted-2);font-size:.78rem;margin-top:10px";
  dbl.textContent = "Maine and Nebraska each award 2 at-large votes to the statewide winner, plus 1 per congressional district (dots on the map, or chips above) — double-click a state to edit its electoral votes or include/exclude it.";
  c.appendChild(dbl);
}

// Mirrors how Wikipedia's own election infoboxes phrase "states carried": states won outright,
// plus DC and any congressional district picked up separately from that state's at-large winner
// (e.g. Trump: "31 + ME-02", Harris: "19 + DC + NE-02" in the real 2024 box).
function statesCarried(partyId){
  let count = 0; const extras = [];
  STATES.forEach(s=>{
    const abbr = s[1];
    if(included[abbr]===false) return;
    const a = assignments[abbr];
    const won = a && a.party===partyId;
    if(abbr==="DC"){ if(won) extras.push("DC"); return; }
    if(won) count++;
  });
  Object.entries(SPLIT_DISTRICTS).forEach(([abbr, sd])=>{
    if(included[abbr]===false) return;
    const stateWinner = assignments[abbr] && assignments[abbr].party;
    sd.districts.forEach(d=>{
      const p = districtAssign[d.abbr] || d.winner;
      if(p===partyId && p!==stateWinner) extras.push(d.abbr.replace("-","-0"));
    });
  });
  return {count, extras};
}

function fmtNum(n){ return n==null ? null : n.toLocaleString("en-US"); }

function renderSummaryView(c){
  const {totals} = computeTally("president");
  const ranked = parties.slice().sort((a,b)=>(totals[b.id]||0)-(totals[a.id]||0)).filter(p=>(totals[p.id]||0)>0);
  const shown = ranked.slice(0,4);
  const totalVotes = shown.reduce((sum,p)=>sum+(p.popularVotes||0),0);

  const box = document.createElement("div"); box.className="infobox";

  const title = document.createElement("div"); title.className="infobox-title"; title.textContent = electionMeta.title || "Election Results";
  box.appendChild(title);
  if(electionMeta.date){ const d = document.createElement("div"); d.className="infobox-date"; d.textContent=electionMeta.date; box.appendChild(d); }

  const {grandTotal} = computeTally("president");
  const majority = Math.floor(grandTotal/2)+1;
  const meta1 = document.createElement("div"); meta1.className="infobox-meta";
  meta1.innerHTML = `${grandTotal} members of the Electoral College<br>${majority} electoral votes needed to win`;
  box.appendChild(meta1);
  if(electionMeta.turnoutPct!=null && electionMeta.turnoutPct!==""){
    const t = document.createElement("div"); t.className="infobox-meta"; t.textContent=`Turnout: ${electionMeta.turnoutPct}%`;
    box.appendChild(t);
  }

  const badges = document.createElement("div"); badges.className="infobox-badges";
  shown.forEach(p=>{
    const b = document.createElement("div"); b.className="infobox-badge"; b.style.background=p.color;
    b.textContent = p.abbr;
    badges.appendChild(b);
  });
  box.appendChild(badges);

  const rows = [
    ["Nominee", p=>p.nominee],
    ["Party", p=>p.name],
    ["Home state", p=>p.homeState],
    ["Running mate", p=>p.runningMate],
    ["Electoral vote", p=>String(totals[p.id]||0)],
    ["States carried", p=>{ const {count, extras} = statesCarried(p.id); return count + (extras.length? " + "+extras.join(" + ") : ""); }],
    ["Popular vote", p=>fmtNum(p.popularVotes)],
    ["Percentage", p=>(p.popularVotes && totalVotes) ? ((p.popularVotes/totalVotes*100).toFixed(1)+"%") : null],
  ];
  const table = document.createElement("table"); table.className="infobox-table";
  rows.forEach(([label, fn])=>{
    const vals = shown.map(fn);
    if(vals.every(v=>!v)) return; // skip rows nobody filled in
    const tr = document.createElement("tr");
    tr.innerHTML = `<th>${label}</th>` + vals.map(v=>`<td>${v||"—"}</td>`).join("");
    table.appendChild(tr);
  });
  box.appendChild(table);

  // small non-interactive map thumbnail
  const thumbWrap = document.createElement("div"); thumbWrap.className="infobox-map";
  const svg = document.createElementNS(SVG_NS,"svg");
  svg.setAttribute("viewBox",MAP_VIEWBOX);
  STATES.forEach(s=>{
    const abbr = s[1];
    const d = STATE_PATHS[abbr]; if(!d) return;
    const path = document.createElementNS(SVG_NS,"path");
    path.setAttribute("d", d);
    const inc = included[abbr]!==false;
    const a = assignments[abbr]; const p = inc && a && partyOf(a.party);
    path.setAttribute("fill", p ? p.color : "var(--map-empty)");
    path.setAttribute("stroke","#0d1117"); path.setAttribute("stroke-width","1");
    svg.appendChild(path);
  });
  thumbWrap.appendChild(svg);
  const legend = document.createElement("div"); legend.className="infobox-legend";
  shown.forEach(p=>{
    const item = document.createElement("span");
    item.innerHTML = `<span class="dot" style="background:${p.color}"></span>${escapeAttr(p.name)}`;
    legend.appendChild(item);
  });
  thumbWrap.appendChild(legend);
  box.appendChild(thumbWrap);

  if(electionMeta.priorNominee || shown.length){
    const winner = shown[0];
    const footTable = document.createElement("table"); footTable.className="infobox-table infobox-footer";
    footTable.innerHTML = `<tr><th>President before election</th><th>Elected President</th></tr>
      <tr><td>${electionMeta.priorNominee || "—"}<br>${partyOf(electionMeta.priorParty)?.name || ""}</td>
          <td>${winner ? (winner.nominee || winner.name) : "—"}<br>${winner ? winner.name : ""}</td></tr>`;
    box.appendChild(footTable);
  }

  c.appendChild(box);
}

function renderEvEditorView(c){
  const wrap = document.createElement("div"); wrap.className="card ev-editor";

  const hd = document.createElement("div"); hd.className="ev-editor-hd";
  const totalEv = STATES.reduce((sum,s)=>sum+evOf(s[1]),0);
  hd.innerHTML = `<h3 style="margin:0">Adjust Electoral Votes</h3><span class="mono">Total: ${totalEv}</span>`;
  wrap.appendChild(hd);

  const resetBtn = document.createElement("button");
  resetBtn.className="scenario-btn"; resetBtn.textContent="Reset all to real apportionment";
  resetBtn.addEventListener("click", ()=>{ evOverrides={}; save(); renderAll(); });
  wrap.appendChild(resetBtn);

  const list = document.createElement("div"); list.className="ev-edit-list";
  STATES.slice().sort((a,b)=>a[0].localeCompare(b[0])).forEach(s=>{
    const abbr = s[1];
    const row = document.createElement("div"); row.className="ev-edit-row";
    const name = document.createElement("span"); name.className="ev-edit-name"; name.textContent = s[0];
    const slider = document.createElement("input");
    slider.type="range"; slider.min="0"; slider.max="60"; slider.value=evOf(abbr);
    slider.className="ev-slider";
    const val = document.createElement("span"); val.className="ev-edit-val mono"; val.textContent = evOf(abbr);
    slider.addEventListener("input", e=>{ val.textContent = e.target.value; });
    slider.addEventListener("change", e=>{ evOverrides[abbr] = +e.target.value; save(); renderAll(); });
    row.appendChild(name); row.appendChild(slider); row.appendChild(val);
    list.appendChild(row);
  });
  wrap.appendChild(list);
  c.appendChild(wrap);
}

function renderPresidentRight(){
  const wrap = document.getElementById("sideRight"); wrap.innerHTML="";
  if(selectedState){
    const s = STATES.find(x=>x[1]===selectedState);
    const card = document.createElement("div"); card.className="card";
    const hd = document.createElement("div"); hd.className="detail-hd";
    hd.innerHTML = `<h3>${s[0]}</h3><button class="close-x">&times;</button>`;
    hd.querySelector(".close-x").addEventListener("click", ()=>{ selectedState=null; renderAll(); });
    card.appendChild(hd);

    const evLabel = document.createElement("div"); evLabel.className="field-label"; evLabel.textContent="Electoral Votes";
    card.appendChild(evLabel);
    const evInput = document.createElement("input");
    evInput.className="ev-input"; evInput.type="number"; evInput.min="0"; evInput.value=evOf(s[1]);
    evInput.addEventListener("change", e=>{
      const v = Math.max(0, parseInt(e.target.value)||0);
      evOverrides[s[1]] = v; save(); renderAll();
    });
    card.appendChild(evInput);

    const incLabel = document.createElement("div"); incLabel.className="field-label"; incLabel.textContent="Participation";
    card.appendChild(incLabel);
    const trow = document.createElement("div"); trow.className="toggle-row";
    trow.innerHTML = `<span>Include in election</span>
      <label class="switch"><input type="checkbox" ${included[s[1]]!==false?"checked":""}><span class="slider"></span></label>`;
    trow.querySelector("input").addEventListener("change", e=>{
      included[s[1]] = e.target.checked; save(); renderAll();
    });
    card.appendChild(trow);
    const note = document.createElement("div");
    note.style.cssText="font-size:.76rem;color:var(--muted);margin-top:8px";
    note.textContent = "Excluding a state removes its EVs, House delegation, and Senate seats from every tab's totals.";
    card.appendChild(note);

    const assignLabel = document.createElement("div"); assignLabel.className="field-label"; assignLabel.textContent="Assign winner";
    card.appendChild(assignLabel);
    const grid = document.createElement("div"); grid.className="assign-grid";
    parties.forEach(p=>{
      const b = document.createElement("button");
      const cur = assignments[s[1]];
      const picked = cur && cur.party===p.id;
      b.className="assign-btn"+(picked?" picked":"");
      if(picked) b.style.background=p.color;
      b.textContent = p.abbr;
      b.addEventListener("click", ()=>{ assignments[s[1]] = {party:p.id, strength:(cur&&cur.strength)||"safe"}; save(); renderAll(); });
      grid.appendChild(b);
    });
    card.appendChild(grid);
    wrap.appendChild(card);
  } else {
    const card = document.createElement("div"); card.className="card";
    card.innerHTML = `<h3>State Detail</h3><div style="color:var(--muted);font-size:.85rem">Double-click any state on the map (or click it in the list below) to edit its electoral votes, include/exclude it, or reassign its winner directly.</div>`;
    wrap.appendChild(card);
  }

  const listCard = document.createElement("div"); listCard.className="card";
  listCard.innerHTML = `<h3>All States</h3>`;
  const list = document.createElement("div"); list.className="states-list";
  STATES.slice().sort((a,b)=>a[0].localeCompare(b[0])).forEach(s=>{
    const abbr=s[1]; const inc = included[abbr]!==false;
    const a = assignments[abbr]; const p = a && partyOf(a.party);
    const row = document.createElement("div"); row.className="row"+(inc?"":" excluded");
    row.innerHTML = `<span><span class="dot" style="background:${p?p.color:'var(--map-empty)'}"></span>${s[0]}</span><span class="mono">${evOf(abbr)}</span>`;
    row.addEventListener("click", ()=>{ selectedState=abbr; renderAll(); });
    list.appendChild(row);
  });
  listCard.appendChild(list);
  wrap.appendChild(listCard);
}

/* ============================== HOUSE TAB ============================== */
function renderHouseLeft(){
  const wrap = document.getElementById("sideLeft"); wrap.innerHTML="";
  const brush = document.createElement("div"); brush.className="card";
  brush.innerHTML = `<h3>Assign Delegation</h3>`;
  const hint = document.createElement("div");
  hint.style.cssText="font-size:.78rem;color:var(--muted)";
  hint.textContent = "Click a state to cycle its whole delegation's 1 vote through your parties.";
  brush.appendChild(hint);
  wrap.appendChild(brush);
  wrap.appendChild(renderPartyManager());
  const note = document.createElement("div"); note.className="card amend-note";
  note.innerHTML = `<h3>12th Amendment — House</h3>
    Triggered if no candidate gets an electoral-vote majority.<br><br>
    &bull; Each state delegation gets <b>1 vote</b><br>
    &bull; Only the <b>top 3</b> electoral-vote finishers are eligible<br>
    &bull; A majority of all states is needed to win<br>
    &bull; DC does not vote (not a state)`;
  wrap.appendChild(note);
}
function renderHouseCenter(){
  const c = document.getElementById("center"); c.innerHTML="";
  c.appendChild(renderTally("house"));
  const grid = document.createElement("div"); grid.className="house-grid";
  STATES.filter(s=>s[1]!=="DC").sort((a,b)=>a[0].localeCompare(b[0])).forEach(s=>{
    const abbr=s[1]; const inc = included[abbr]!==false;
    const cell = document.createElement("div"); cell.className="house-cell"+(inc?"":" excluded");
    const p = inc ? partyOf(houseAssign[abbr]) : null;
    if(p) { cell.style.background=p.color; cell.style.color="#fff"; }
    cell.innerHTML = `<span class="abbr">${abbr}</span><span class="n">${s[3]} seats</span>`;
    cell.addEventListener("click", ()=>{ if(inc){ houseAssign[abbr]=nextPartyId(houseAssign[abbr]); save(); renderAll(); } });
    grid.appendChild(cell);
  });
  c.appendChild(grid);
}
function renderHouseRight(){
  const wrap = document.getElementById("sideRight"); wrap.innerHTML="";
  const card = document.createElement("div"); card.className="card";
  card.innerHTML = `<h3>Delegation Breakdown</h3>`;
  const list = document.createElement("div"); list.className="states-list";
  const {totals} = computeTally("house");
  parties.forEach(p=>{
    const row = document.createElement("div"); row.className="row";
    row.innerHTML = `<span><span class="dot" style="background:${p.color}"></span>${p.name}</span><span class="mono">${totals[p.id]||0}</span>`;
    list.appendChild(row);
  });
  card.appendChild(list);
  wrap.appendChild(card);
}

/* ============================== SENATE TAB ============================== */
function renderSenateLeft(){
  const wrap = document.getElementById("sideLeft"); wrap.innerHTML="";
  const brush = document.createElement("div"); brush.className="card";
  brush.innerHTML = `<h3>Assign Seat</h3>`;
  const hint = document.createElement("div");
  hint.style.cssText="font-size:.78rem;color:var(--muted)";
  hint.textContent = "Click a seat to cycle it through your parties, right-click to clear it.";
  brush.appendChild(hint);
  wrap.appendChild(brush);
  wrap.appendChild(renderPartyManager());

  const scen = document.createElement("div"); scen.className="card";
  scen.innerHTML = `<h3>Scenarios</h3>`;
  const seatKeys = Object.keys(senateAssign).filter(k=>included[k.split("-")[0]]!==false);
  const mk = (label, fn) => { const b=document.createElement("button"); b.className="scenario-btn"; b.textContent=label; b.addEventListener("click", ()=>{ fn(); save(); renderAll(); }); return b; };
  scen.appendChild(mk("Real current Senate", ()=>{
    STATES.forEach(s=>{
      const abbr=s[1], makeup=s[5]; const seats=[];
      for(let i=0;i<makeup[0];i++) seats.push("D");
      for(let i=0;i<makeup[1];i++) seats.push("R");
      for(let i=0;i<makeup[2];i++) seats.push("I");
      seats.forEach((p,i)=>{ senateAssign[abbr+"-"+i]=p; });
    });
  }));
  scen.appendChild(mk("50 / 50 split", ()=>{
    const two = parties.slice(0,2);
    seatKeys.forEach((k,i)=>{ senateAssign[k]= i%2===0?two[0].id:two[1].id; });
  }));
  scen.appendChild(mk("Clear all", ()=>{ seatKeys.forEach(k=>delete senateAssign[k]); }));
  wrap.appendChild(scen);

  const note = document.createElement("div"); note.className="card amend-note";
  note.innerHTML = `<h3>12th Amendment — Senate</h3>
    Elects the VP if no candidate gets an electoral-vote majority.<br><br>
    &bull; Each senator gets <b>1 vote</b><br>
    &bull; Only the <b>top 2</b> VP finishers are eligible<br>
    &bull; A majority of the <b>whole Senate</b> is needed to win`;
  wrap.appendChild(note);
}
function renderSenateCenter(){
  const c = document.getElementById("center"); c.innerHTML="";
  c.appendChild(renderTally("senate"));
  const grid = document.createElement("div"); grid.className="senate-grid";
  STATES.forEach(s=>{
    const abbr=s[1]; if(included[abbr]===false) return;
    const makeup=s[5]; const n = makeup[0]+makeup[1]+makeup[2];
    for(let i=0;i<n;i++){
      const key = abbr+"-"+i;
      const seat = document.createElement("div"); seat.className="seat";
      const p = partyOf(senateAssign[key]);
      if(p){ seat.style.background=p.color; }
      seat.title = s[0]+" seat "+(i+1);
      seat.textContent = abbr;
      seat.addEventListener("click", ()=>{ senateAssign[key]=nextPartyId(senateAssign[key]); save(); renderAll(); });
      seat.addEventListener("contextmenu", e=>{ e.preventDefault(); delete senateAssign[key]; save(); renderAll(); });
      grid.appendChild(seat);
    }
  });
  c.appendChild(grid);
}
function renderSenateRight(){
  const wrap = document.getElementById("sideRight"); wrap.innerHTML="";
  const card = document.createElement("div"); card.className="card";
  card.innerHTML = `<h3>Seat Breakdown</h3>`;
  const list = document.createElement("div"); list.className="states-list";
  const {totals} = computeTally("senate");
  parties.forEach(p=>{
    const row = document.createElement("div"); row.className="row";
    row.innerHTML = `<span><span class="dot" style="background:${p.color}"></span>${p.name}</span><span class="mono">${totals[p.id]||0}</span>`;
    list.appendChild(row);
  });
  card.appendChild(list);
  wrap.appendChild(card);
}

/* ============================== MAIN RENDER ============================== */
function renderAll(){
  if(activeTab==="president"){ renderPresidentLeft(); renderPresidentCenter(); renderPresidentRight(); }
  else if(activeTab==="house"){ renderHouseLeft(); renderHouseCenter(); renderHouseRight(); }
  else { renderSenateLeft(); renderSenateCenter(); renderSenateRight(); }
}

/* ============================== THEME ============================== */
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelectorAll("#themeToggle .tab-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.themeChoice===theme);
  });
  try{ localStorage.setItem("electoral_studio_theme", theme); }catch(e){}
}
function initTheme(){
  let theme;
  try{ theme = localStorage.getItem("electoral_studio_theme"); }catch(e){}
  if(!theme) theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  applyTheme(theme);
  document.getElementById("themeToggle").addEventListener("click", e=>{
    const b = e.target.closest("[data-theme-choice]"); if(!b) return;
    applyTheme(b.dataset.themeChoice);
  });
}

initTheme();
if(!loadSaved()) initDefaults();
renderAll();
})();
