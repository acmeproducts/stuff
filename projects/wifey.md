--- 

TARGET: projects/wifey.html
STATE: open: none | next: none

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Wifey</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f2f2f7; color: #1c1c1e; line-height: 1.4; overflow-x:hidden; }
  
  .search-container { position: sticky; top: 0; background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); border-bottom: 1px solid #d1d1d6; padding: 12px; z-index: 100; }
  #omnisearch { width: 100%; padding: 14px; font-size: 17px; border: 1px solid #c7c7cc; border-radius: 10px; -webkit-appearance: none; background: #fff; }
  
  .cards-container { padding: 12px; display: flex; flex-direction: column; gap: 12px; padding-bottom: 100px; }
  .card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); cursor: pointer; position: relative; transition: transform 0.1s; }
  .card:active { transform: scale(0.98); }
  .card-title { font-size: 17px; font-weight: 600; margin-bottom: 6px; word-break: break-word; }
  .card-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
  .tag { background: #007aff; color: #fff; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: 500; }
  .card-date { color: #8e8e93; font-size: 13px; display: flex; align-items: center; gap: 4px; }
  .card-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; margin-left: auto; border: 1px solid #e5e5ea; }
  
  .empty-state { text-align: center; padding: 60px 20px; color: #8e8e93; }
  .empty-state h3 { font-size: 20px; margin-bottom: 8px; color: #1c1c1e; }
  
  #detail-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 200; align-items: flex-end; }
  #detail-modal.active { display: flex; }
  .modal-content { background: #fff; width: 100%; max-height: 92vh; max-width: 100vw; border-radius: 20px 20px 0 0; overflow: hidden; display: flex; flex-direction: column; animation: slideUp 0.2s ease-out; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-header { padding: 16px 20px; border-bottom: 1px solid #e5e5ea; display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-size: 19px; font-weight: 700; }
  .close-btn { font-size: 28px; color: #8e8e93; background: none; border: none; min-width:44px; min-height:44px; padding:0; display:flex; align-items:center; justify-content:center; }
  .modal-body { overflow-y: auto; padding: 20px; flex: 1; -webkit-overflow-scrolling: touch; }
  
  .field { margin-bottom: 24px; }
  .field-label { font-size: 13px; text-transform: uppercase; color: #8e8e93; font-weight: 600; margin-bottom: 8px; display: block; letter-spacing: 0.3px; }
  input[type="text"], input[type="date"], input[type="url"] { width: 100%; padding: 12px; border: 1px solid #c7c7cc; border-radius: 8px; font-size: 16px; -webkit-appearance: none; }
  input:focus { outline:none; border-color:#007aff; }
  
  .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .tag-item { background:#007aff; color:#fff; padding:6px 12px; border-radius:14px; font-size:14px; display:flex; align-items:center; gap:6px; }
  .tag-remove { cursor:pointer; font-weight:700; opacity:0.9; }
  .btn-add { background:#34c759; color:#fff; border:none; padding:10px 16px; border-radius:10px; font-size:15px; font-weight:500; cursor:pointer; }
  .btn-add:active { opacity:0.8; }
  
  .url-list { margin-bottom:12px; display:flex; flex-direction:column; gap:8px; }
  .url-item { display:flex; align-items:center; padding:10px 12px; background:#f2f2f7; border-radius:8px; word-break:break-all; }
  .url-link { flex:1; color:#007aff; text-decoration:none; font-size:15px; margin-right:8px; }
  .url-remove { color:#ff3b30; font-size:20px; cursor:pointer; padding:0 4px; }
  
  .image-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:12px; }
  .image-item { position:relative; aspect-ratio:1; border-radius:8px; overflow:hidden; }
  .image-item img { width:100%; height:100%; object-fit:cover; display:block; }
  .image-remove { position:absolute; top:-6px; right:-6px; background:#ff3b30; color:#fff; border-radius:50%; width:24px; height:24px; border:2px solid #fff; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; line-height:1; box-shadow:0 1px 3px rgba(0,0,0,0.3); }
  .btn-image { width:100%; padding:14px; background:#ff9500; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:500; cursor:pointer; }
  .btn-image:active { opacity:0.9; }
  #file-input { display:none; }
  
  .danger-zone { margin-top:32px; padding-top:24px; border-top:2px solid #ff3b30; }
  .btn-delete { width:100%; padding:14px; background:#ff3b30; color:#fff; border:none; border-radius:10px; font-size:16px; font-weight:500; cursor:pointer; }
  .btn-delete:active { opacity:0.9; }
  
  #diag-toggle { position:fixed; bottom:20px; right:20px; width:60px; height:60px; border-radius:50%; background:#1c1c1e; color:#0f0; border:none; font-family:"SF Mono",Monaco,monospace; font-size:11px; z-index:300; box-shadow:0 4px 12px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; cursor:pointer; }
  #diag-panel { display:none; position:fixed; bottom:90px; right:20px; width:calc(100% - 40px); max-width:380px; background:rgba(0,0,0,0.95); color:#0f0; padding:16px; border-radius:12px; font-family:"SF Mono",Monaco,monospace; font-size:12px; max-height:400px; overflow-y:auto; z-index:300; box-shadow:0 8px 24px rgba(0,0,0,0.4); line-height:1.5; }
  #diag-panel.active { display:block; }
  .diag-line { margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:4px; }
  .diag-btn { background:#333; color:#0f0; border:1px solid #0f0; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; margin-top:8px; margin-right:8px; }
  
  @media (min-width:768px) {
    #detail-modal { align-items:center; justify-content:center; padding:20px; }
    .modal-content { max-height:85vh; width:100%; max-width:540px; border-radius:16px; animation:fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    .cards-container { max-width:600px; margin:0 auto; width:100%; }
    .search-container { display:flex; justify-content:center; }
    #omnisearch { max-width:600px; }
  }
  @media (max-width:360px) {
    .modal-content { width:90%; border-radius:16px 16px 0 0; }
    .modal-header { padding:12px 16px; }
    .close-btn { min-width:44px; min-height:44px; }
  }
</style>
</head>
<body>

<div class="search-container">
  <input type="text" id="omnisearch" placeholder="Search or type to create..." autocomplete="off" autocapitalize="off">
</div>

<div id="cards-container" class="cards-container"></div>

<div id="detail-modal">
  <div class="modal-content">
    <div class="modal-header">
      <div class="modal-title">Card Details</div>
      <button class="close-btn" onclick="closeDetail()">&times;</button>
    </div>
    <div class="modal-body" id="modal-body"></div>
  </div>
</div>

<button id="diag-toggle" onclick="toggleDiag()">diag</button>
<div id="diag-panel"></div>

<script>
const STORAGE_KEY = 'wifey_data_v1';
let tasks = [];
let currentTaskId = null;
let diagLogs = [];

function log(msg) {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  diagLogs.push(entry);
  if (diagLogs.length > 50) diagLogs.shift();
  updateDiagPanel();
  console.log(entry);
}

function updateDiagPanel() {
  const panel = document.getElementById('diag-panel');
  const lines = diagLogs.map(l => `<div class="diag-line">${l}</div>`).join('');
  const sizeKB = Math.round(JSON.stringify(tasks).length / 1024);
  const stats = `Tasks: ${tasks.length} | Storage: ${sizeKB}KB`;
  const controls = `<button class="diag-btn" onclick="clearAllData()">CLEAR DATA</button>`;
  panel.innerHTML = lines + `<div style="margin-top:12px;color:#8e8e93">${stats}</div>${controls}`;
}

function toggleDiag() { document.getElementById('diag-panel').classList.toggle('active'); }

function clearAllData() {
  if (confirm('DELETE ALL DATA?')) {
    localStorage.removeItem(STORAGE_KEY);
    tasks = [];
    render();
    log('All data cleared');
  }
}

function saveData() {
  try {
    const json = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEY, json);
    log('Persisted to LocalStorage (' + Math.round(json.length/1024) + 'KB)');
  } catch (e) {
    log('SAVE FAILED: ' + e.message);
    if (e.name === 'QuotaExceededError') {
      alert('Storage quota exceeded. Remove some images or tasks.');
    }
  }
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    tasks = JSON.parse(raw);
    log(`Loaded ${tasks.length} tasks`);
  } else {
    log('No existing data found');
  }
  render();
}

function createTask(title) {
  const task = { id: Date.now(), title: title.trim(), tags: [], dueDate: '', urls: [], images: [] };
  tasks.unshift(task);
  saveData();
  render();
  openDetail(task.id);
  log(`Created: "${task.title}"`);
}

function updateTask(id, updates) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx > -1) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveData();
    render(document.getElementById('omnisearch').value.toLowerCase());
  }
}

function deleteTask(id) {
  if (confirm('Delete this card permanently?')) {
    tasks = tasks.filter(t => t.id !== id);
    saveData();
    closeDetail();
    render();
    log('Deleted task ' + id);
  }
}

const searchInput = document.getElementById('omnisearch');
searchInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    const val = searchInput.value.trim();
    if (!val) return;
    const existing = tasks.find(t => t.title.toLowerCase() === val.toLowerCase());
    if (existing) { openDetail(existing.id); log('Opened existing'); }
    else { createTask(val); }
    searchInput.value = '';
  }
});
searchInput.addEventListener('input', e => render(e.target.value.toLowerCase()));

function render(filter = '') {
  const container = document.getElementById('cards-container');
  let list = tasks;
  if (filter) {
    list = tasks.filter(t => t.title.toLowerCase().includes(filter) ||
      t.tags.some(tag => tag.toLowerCase().includes(filter)));
  }
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><h3>No tasks found</h3><p>Type in the search box and press Enter to create a new card.</p></div>`;
    return;
  }
  container.innerHTML = list.map(t => {
    const thumb = t.images.length ? `<img src="${t.images[0]}" class="card-thumb" alt="">` : '';
    const date = t.dueDate ? `<span class="card-date">📅 ${t.dueDate}</span>` : '';
    const tags = t.tags.slice(0,3).map(tag=>`<span class="tag">${escapeHtml(tag)}</span>`).join('');
    return `<div class="card" onclick="openDetail(${t.id})">
      <div class="card-title">${escapeHtml(t.title)}</div>
      <div class="card-meta">${tags}${date}${t.urls.length?`<span class="card-date">🔗${t.urls.length}</span>`:''}${t.images.length?`<span class="card-date">🖼️${t.images.length}</span>`:''}</div>
      ${thumb}
    </div>`;
  }).join('');
}

function escapeHtml(txt){ const d=document.createElement('div'); d.textContent=txt; return d.innerHTML; }

function openDetail(id){
  currentTaskId=id;
  const task=tasks.find(t=>t.id===id);
  if(!task) return;
  const body=document.getElementById('modal-body');
  body.innerHTML=`
    <div class="field"><label class="field-label">Title</label><input type="text" value="${escapeHtml(task.title)}" onchange="updateTask(${task.id},{title:this.value})"></div>
    <div class="field"><label class="field-label">Tags</label>
      <div class="tags-container" id="detail-tags">
        ${task.tags.map((tg,i)=>`<span class="tag-item">${escapeHtml(tg)}<span class="tag-remove" onclick="removeTag(${i})">&times;</span></span>`).join('')}
      </div>
      <button class="btn-add" onclick="promptAddTag()">+ Add Tag</button>
    </div>
    <div class="field"><label class="field-label">Due Date</label><input type="date" value="${task.dueDate}" onchange="updateTask(${task.id},{dueDate:this.value})"></div>
    <div class="field"><label class="field-label">Attached URLs</label>
      <div class="url-list" id="detail-urls">
        ${task.urls.map((u,i)=>`<div class="url-item"><a href="${escapeHtml(u)}" target="_blank" class="url-link" onclick="event.stopPropagation()">${escapeHtml(u.length>50?u.slice(0,50)+'...':u)}</a><span class="url-remove" onclick="removeUrl(${i})">&times;</span></div>`).join('')}
      </div>
      <button class="btn-add" style="background:#5856d6" onclick="promptAddUrl()">+ Add URL</button>
    </div>
    <div class="field"><label class="field-label">Images</label>
      <div class="image-grid" id="detail-images">
        ${task.images.map((img,i)=>`<div class="image-item"><img src="${img}" alt=""><span class="image-remove" onclick="removeImage(${i})">&times;</span></div>`).join('')}
      </div>
      <button class="btn-image" onclick="document.getElementById('file-input').click()">📷 Attach Image</button>
      <input type="file" id="file-input" accept="image/*" capture="environment" onchange="handleImageUpload(this.files[0])">
    </div>
    <div class="danger-zone"><button class="btn-delete" onclick="deleteTask(${task.id})">Delete Card</button></div>
  `;
  document.getElementById('detail-modal').classList.add('active');
  log('Opened detail: '+task.title);
}

function closeDetail(){ document.getElementById('detail-modal').classList.remove('active'); currentTaskId=null; }

function promptAddTag(){
  const tag=prompt('Enter tag name:');
  if(tag && tag.trim()){
    const task=tasks.find(t=>t.id===currentTaskId);
    if(task && !task.tags.includes(tag.trim())){
      task.tags.push(tag.trim());
      updateTask(currentTaskId,{tags:task.tags});
      openDetail(currentTaskId);
    }
  }
}
function removeTag(i){
  const task=tasks.find(t=>t.id===currentTaskId);
  if(task){ task.tags.splice(i,1); updateTask(currentTaskId,{tags:task.tags}); openDetail(currentTaskId); }
}
function promptAddUrl(){
  const url=prompt('Enter URL (include https://):');
  if(url && url.trim()){
    let u=url.trim();
    if(!u.startsWith('http')) u='https://'+u;
    const task=tasks.find(t=>t.id===currentTaskId);
    if(task){ task.urls.push(u); updateTask(currentTaskId,{urls:task.urls}); openDetail(currentTaskId); }
  }
}
function removeUrl(i){
  const task=tasks.find(t=>t.id===currentTaskId);
  if(task){ task.urls.splice(i,1); updateTask(currentTaskId,{urls:task.urls}); openDetail(currentTaskId); }
}

function compressImage(dataUrl, maxW=800, maxH=800, quality=0.6){
  return new Promise((res,rej)=>{
    const img=new Image();
    img.onload=()=>{ 
      let w=img.width, h=img.height;
      if(w>h){ if(w>maxW){ h*=maxW/w; w=maxW; } }
      else{ if(h>maxH){ w*=maxH/h; h=maxH; } }
      const canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img,0,0,w,h);
      try{ res(canvas.toDataURL('image/jpeg',quality)); }
      catch(e){ rej(e); }
    };
    img.onerror=()=>rej(new Error('Image load error'));
    img.src=dataUrl;
  });
}

async function handleImageUpload(file){
  if(!file) return;
  if(file.size>10*1024*1024){ alert('Image too large (max 10 MB)'); return; }
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const compressed=await compressImage(e.target.result,800,800,0.6);
      const task=tasks.find(t=>t.id===currentTaskId);
      if(task){ task.images.push(compressed); updateTask(currentTaskId,{images:task.images}); openDetail(currentTaskId); log('Image attached'); }
    }catch(err){ log('Image error: '+err.message); alert('Image processing failed'); }
  };
  reader.onerror=()=>{ log('File read error'); alert('Could not read image'); };
  reader.readAsDataURL(file);
  document.getElementById('file-input').value='';
}
function removeImage(i){
  const task=tasks.find(t=>t.id===currentTaskId);
  if(task){ task.images.splice(i,1); updateTask(currentTaskId,{images:task.images}); openDetail(currentTaskId); log('Image removed'); }
}

document.getElementById('detail-modal').addEventListener('click',e=>{ if(e.target===e.currentTarget) closeDetail(); });

loadData();
updateDiagPanel();
log('App initialized');
</script>
</body>
</html>
