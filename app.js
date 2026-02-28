let data = [];
let rateKey = "atl";

const elQ = document.getElementById("q");
const elSection = document.getElementById("section");
const elCategory = document.getElementById("category");
const elRows = document.getElementById("rows");
const elCount = document.getElementById("count");

const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const btnClose = document.getElementById("close");

const dSection = document.getElementById("dSection");
const dTitle = document.getElementById("dTitle");
const dRate = document.getElementById("dRate");
const dNotes = document.getElementById("dNotes");
const dRef = document.getElementById("dRef");

function norm(s){ return (s || "").toString().toLowerCase().trim(); }

function unique(arr){
  return Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>a.localeCompare(b));
}

function setOptions(selectEl, values, firstLabel){
  const current = selectEl.value;
  selectEl.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = firstLabel;
  selectEl.appendChild(opt0);
  values.forEach(v=>{
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    selectEl.appendChild(o);
  });
  // keep selection if still exists
  if ([...selectEl.options].some(o=>o.value===current)) selectEl.value = current;
}

/**
 * Display rate safely.
 * - For late_filer: if missing/blank/'-' => "Not applicable"
 * - For others: if missing/blank => "-"
 */
function displayRate(row, key){
  const val = row?.rates?.[key];

  if (key === "late_filer") {
    if (
      val === null ||
      val === undefined ||
      String(val).trim() === "" ||
      String(val).trim() === "-"
    ) {
      return "Not applicable";
    }
    return String(val);
  }

  if (val === null || val === undefined || String(val).trim() === "") return "-";
  return String(val);
}

function render(){
  const q = norm(elQ.value);
  const sec = elSection.value;
  const cat = elCategory.value;

  const filtered = data.filter(r=>{
    const hay = [
      r.section, r.category, r.title,
      ...(r.notes || []),
      r.reference
    ].map(norm).join(" | ");

    const okQ = !q || hay.includes(q);
    const okSec = !sec || r.section === sec;
    const okCat = !cat || r.category === cat;
    return okQ && okSec && okCat;
  });

  elCount.textContent = String(filtered.length);

  elRows.innerHTML = "";
  filtered.forEach(r=>{
    const tr = document.createElement("tr");
    tr.className = "dataRow";
    tr.dataset.section = r.section;

    const tdSec = document.createElement("td");
    tdSec.innerHTML = `<div><strong>${r.section}</strong></div><div class="small">${r.category || ""}</div>`;

    const tdTitle = document.createElement("td");
    tdTitle.textContent = r.title || "";

    const tdRate = document.createElement("td");
    tdRate.className = "right";
    tdRate.textContent = displayRate(r, rateKey);

    tr.appendChild(tdSec);
    tr.appendChild(tdTitle);
    tr.appendChild(tdRate);

    tr.addEventListener("click", ()=>openDrawer(r));
    elRows.appendChild(tr);
  });
}

function openDrawer(r){
  dSection.textContent = r.section || "";
  dTitle.textContent = `${r.category ? r.category + " — " : ""}${r.title || ""}`;
  dRate.textContent = displayRate(r, rateKey);

  dNotes.innerHTML = "";
  (r.notes || []).forEach(n=>{
    const li = document.createElement("li");
    li.textContent = n;
    dNotes.appendChild(li);
  });

  dRef.textContent = r.reference || "-";

  drawer.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer(){
  drawer.classList.add("hidden");
  drawer.setAttribute("aria-hidden", "true");
}

function bind(){
  elQ.addEventListener("input", render);
  elSection.addEventListener("change", render);
  elCategory.addEventListener("change", render);

  document.querySelectorAll(".pill").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".pill").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      rateKey = btn.dataset.rate;
      render();
    });
  });

  btnClose.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") closeDrawer();
  });
}

async function init(){
  const res = await fetch("./ratecard.json", { cache: "no-store" });
  data = await res.json();

  setOptions(elSection, unique(data.map(d=>d.section)), "All Sections");
  setOptions(elCategory, unique(data.map(d=>d.category)), "All Categories");

  bind();
  render();
}

init();
