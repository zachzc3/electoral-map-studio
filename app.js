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
const DC_HIT = {cx:801.6, cy:252.1, r:7};

/* ============================== STATE ============================== */
let parties = [
  {id:"D", name:"Democratic", abbr:"D", color:"#3b82c4"},
  {id:"R", name:"Republican", abbr:"R", color:"#c4453b"},
  {id:"I", name:"Independent", abbr:"I", color:"#8b7ab8"}
];
let brushParty = "D", brushStrength = "safe";
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
    return true;
  }catch(e){ return false; }
}
function save(){
  try{
    localStorage.setItem("electoral_studio_v2", JSON.stringify({parties,assignments,districtAssign,evOverrides,included,houseAssign,senateAssign}));
  }catch(e){}
}

function evOf(abbr){
  const s = STATES.find(x=>x[1]===abbr);
  return evOverrides[abbr] != null ? evOverrides[abbr] : s[2];
}
function partyOf(id){ return parties.find(p=>p.id===id); }
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
      if(brushParty===p.id) brushParty = parties[0].id;
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
  const chips = document.createElement("div"); chips.className="brush-parties";
  parties.forEach(p=>{
    const c = document.createElement("button");
    c.className="brush-chip"; c.textContent=p.abbr; c.title=p.name;
    c.style.background = brushParty===p.id ? p.color : "var(--panel-2)";
    c.style.color = brushParty===p.id ? "#fff" : "var(--muted)";
    c.style.borderColor = brushParty===p.id ? p.color : "var(--line)";
    c.addEventListener("click", ()=>{ brushParty=p.id; renderPresidentLeft(); });
    chips.appendChild(c);
  });
  brush.appendChild(chips);
  const srow = document.createElement("div"); srow.className="strength-row";
  STRENGTHS.forEach(st=>{
    const b = document.createElement("button");
    b.className="strength-btn"+(brushStrength===st?" active":"");
    b.style.setProperty("--picked", partyOf(brushParty)?.color || "var(--accent)");
    b.textContent = STRENGTH_LABEL[st];
    b.addEventListener("click", ()=>{ brushStrength=st; renderPresidentLeft(); });
    srow.appendChild(b);
  });
  brush.appendChild(srow);
  const hint = document.createElement("div");
  hint.style.cssText="font-size:.78rem;color:var(--muted);margin-top:10px";
  hint.textContent = "Click a state to paint it, right-click to clear it, double-click for details.";
  brush.appendChild(hint);
  wrap.appendChild(brush);
  wrap.appendChild(renderPartyManager());
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

  const wrap = document.createElement("div"); wrap.className="mapwrap";
  const svg = document.createElementNS(SVG_NS,"svg");
  svg.setAttribute("viewBox","0 0 959 593");
  svg.setAttribute("class","usmap");

  function wireHandlers(el, abbr){
    el.addEventListener("click", ()=>{
      if(included[abbr]===false) return;
      assignments[abbr] = {party:brushParty, strength:brushStrength};
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
    if(abbr==="DC") return; // DC drawn separately as a hit-circle below
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

  // DC: draw its (tiny) real path plus a bigger invisible-ish hit circle so it's actually clickable
  const dcPath = document.createElementNS(SVG_NS,"path");
  dcPath.setAttribute("d", STATE_PATHS.DC || "");
  applyStateVisual(dcPath, "DC");
  svg.appendChild(dcPath);
  const dcHit = document.createElementNS(SVG_NS,"circle");
  dcHit.setAttribute("cx", DC_HIT.cx); dcHit.setAttribute("cy", DC_HIT.cy); dcHit.setAttribute("r", DC_HIT.r);
  dcHit.setAttribute("class","dc-hit");
  const dcTitle = document.createElementNS(SVG_NS,"title");
  dcTitle.textContent = `District of Columbia — ${evOf("DC")} EV`;
  dcHit.appendChild(dcTitle);
  applyStateVisual(dcHit, "DC");
  wireHandlers(dcHit, "DC");
  svg.appendChild(dcHit);

  wrap.appendChild(svg);
  c.appendChild(wrap);

  // Split-vote callout row (Maine / Nebraska congressional districts)
  const splitRow = document.createElement("div"); splitRow.className="split-votes";
  Object.entries(SPLIT_DISTRICTS).forEach(([stateAbbr, sd])=>{
    sd.districts.forEach(d=>{
      const p = partyOf(districtAssign[d.abbr] || d.winner);
      const chip = document.createElement("button");
      chip.className="split-chip";
      chip.style.background = p ? p.color : "var(--map-empty)";
      chip.title = `${d.abbr} (1 EV, congressional district)`;
      chip.innerHTML = `${d.abbr} <span class="n">1 EV</span>`;
      chip.addEventListener("click", ()=>{ districtAssign[d.abbr]=brushParty; save(); renderAll(); });
      chip.addEventListener("contextmenu", e=>{ e.preventDefault(); districtAssign[d.abbr]=d.winner; save(); renderAll(); });
      splitRow.appendChild(chip);
    });
  });
  c.appendChild(splitRow);

  const dbl = document.createElement("div");
  dbl.style.cssText="text-align:center;color:var(--muted-2);font-size:.78rem;margin-top:10px";
  dbl.textContent = "Maine and Nebraska each award 2 at-large votes to the statewide winner, plus 1 per congressional district (chips above) — double-click a state on the map to edit its electoral votes or include/exclude it.";
  c.appendChild(dbl);
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
  const chips = document.createElement("div"); chips.className="brush-parties";
  parties.forEach(p=>{
    const c = document.createElement("button");
    c.className="brush-chip"; c.textContent=p.abbr; c.title=p.name;
    c.style.background = brushParty===p.id ? p.color : "var(--panel-2)";
    c.style.color = brushParty===p.id ? "#fff" : "var(--muted)";
    c.addEventListener("click", ()=>{ brushParty=p.id; renderHouseLeft(); });
    chips.appendChild(c);
  });
  brush.appendChild(chips);
  const hint = document.createElement("div");
  hint.style.cssText="font-size:.78rem;color:var(--muted);margin-top:8px";
  hint.textContent = "Click a state to give its whole delegation's 1 vote to the selected party.";
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
    cell.addEventListener("click", ()=>{ if(inc){ houseAssign[abbr]=brushParty; save(); renderAll(); } });
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
  const chips = document.createElement("div"); chips.className="brush-parties";
  parties.forEach(p=>{
    const c = document.createElement("button");
    c.className="brush-chip"; c.textContent=p.abbr; c.title=p.name;
    c.style.background = brushParty===p.id ? p.color : "var(--panel-2)";
    c.style.color = brushParty===p.id ? "#fff" : "var(--muted)";
    c.addEventListener("click", ()=>{ brushParty=p.id; renderSenateLeft(); });
    chips.appendChild(c);
  });
  brush.appendChild(chips);
  const hint = document.createElement("div");
  hint.style.cssText="font-size:.78rem;color:var(--muted);margin-top:8px";
  hint.textContent = "Click a seat to assign it, right-click to clear it.";
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
      seat.addEventListener("click", ()=>{ senateAssign[key]=brushParty; save(); renderAll(); });
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

if(!loadSaved()) initDefaults();
renderAll();
})();
