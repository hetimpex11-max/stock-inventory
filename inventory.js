// Full fix for inventory.js - save new data correctly and generate QR code reliably

let inventory = JSON.parse(localStorage.getItem('inventory')) || {};
let salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];

function saveInventory() {
  localStorage.setItem('inventory', JSON.stringify(inventory));
  renderInventory();
}

function makeSKU(d, s, c, size) {
  return `${d}-${s}-${c}-${size}`.toUpperCase();
}

function addInventory() {
  const d = document.getElementById('designNumber').value.trim();
  const s = document.getElementById('style').value.trim();
  const c = document.getElementById('color').value.trim();
  const size = document.getElementById('size').value.trim();
  const pieces = parseInt(document.getElementById('pieces').value);

  if (!d || !s || !c || !size || isNaN(pieces) || pieces <= 0) {
    return alert('Enter valid product details.');
  }

  const sku = makeSKU(d, s, c, size);

  if(!inventory[sku]) inventory[sku] = 0;
  inventory[sku] += pieces;

  saveInventory();
  generateQRForAddRestock(sku, d);
  alert(`Added ${pieces} pieces for ${sku}`);
}

function generateQRForAddRestock(sku, designNumber){
  const container = document.getElementById('addRestockQR');
  container.innerHTML = '';

  const qrBox = document.createElement('div');
  qrBox.style.display = 'flex';
  qrBox.style.flexDirection = 'column';
  qrBox.style.alignItems = 'center';
  qrBox.style.marginTop = '15px';

  const qrDiv = document.createElement('div');
  qrBox.appendChild(qrDiv);

  try{
    if(window.QRCode) new QRCode(qrDiv, {text:sku,width:150,height:150,colorDark:'#4A148C',colorLight:'#f5f5f5',correctLevel:QRCode.CorrectLevel.H});
  } catch(e){
    console.error('QR Code generation failed', e);
  }

  const label = document.createElement('div');
  label.innerText = `Design #: ${designNumber}`;
  label.style.fontWeight='bold'; label.style.marginTop='5px';
  qrBox.appendChild(label);

  const downloadBtn = document.createElement('button');
  downloadBtn.innerText='Download QR';
  downloadBtn.style.marginTop='10px';
  downloadBtn.onclick = function(){
    const img = qrDiv.querySelector('img');
    if(img){
      const a = document.createElement('a');
      a.href = img.src;
      a.download = `${sku}.png`;
      a.click();
    } else alert('QR image not generated yet');
  };
  qrBox.appendChild(downloadBtn);
  container.appendChild(qrBox);
}

function renderInventory(sortBy='design') {
  const container = document.getElementById('inventoryList');
  container.innerHTML = '';
  let items = Object.keys(inventory).map(sku => {
    const [d,s,c,size] = sku.split('-');
    return {sku, design:d, style:s, color:c, size, stock:inventory[sku]};
  });

  if(sortBy){
    items.sort((a,b)=> a[sortBy].localeCompare(b[sortBy]));
  }

  let table = `<table class='inventory-table'><tr><th>Design #</th><th>Style</th><th>Color</th><th>Size</th><th>Stock</th><th>QR</th></tr>`;
  let total=0;
  items.forEach(item=>{
    table+=`<tr><td>${item.design}</td><td>${item.style}</td><td>${item.color}</td><td>${item.size}</td><td class='${item.stock<5?'low-stock':''}'>${item.stock}</td><td><button onclick="openQR('${item.sku}')">QR</button></td></tr>`;
    total+=item.stock;
  });
  table+=`</table><div class='total-pieces'>Total Pieces: ${total}</div>`;
  container.innerHTML=table;
}

function sortInventory(by){ renderInventory(by); }

function openQR(sku){
  const modal=document.createElement('div');
  modal.style.position='fixed'; modal.style.top=0; modal.style.left=0; modal.style.width='100%'; modal.style.height='100%'; modal.style.background='rgba(0,0,0,0.7)'; modal.style.display='flex'; modal.style.justifyContent='center'; modal.style.alignItems='center'; modal.style.zIndex=9999;

  const qrBox=document.createElement('div');
  qrBox.style.background='#fff'; qrBox.style.padding='20px'; qrBox.style.borderRadius='10px'; qrBox.style.textAlign='center';

  const qrDiv=document.createElement('div');
  qrBox.appendChild(qrDiv);

  try{ new QRCode(qrDiv,{text:sku,width:250,height:250,colorDark:'#4A148C',colorLight:'#f5f5f5',correctLevel:QRCode.CorrectLevel.H}); } catch(e){ console.error(e); }

  const downloadBtn=document.createElement('button');
  downloadBtn.innerText='Download QR'; downloadBtn.style.marginTop='10px';
  downloadBtn.onclick=function(){ const img=qrDiv.querySelector('img'); if(img){ const a=document.createElement('a'); a.href=img.src; a.download=`${sku}.png`; a.click(); } else alert('QR not ready'); };
  qrBox.appendChild(downloadBtn);

  const closeBtn=document.createElement('button'); closeBtn.innerText='Close'; closeBtn.style.marginLeft='10px'; closeBtn.onclick=function(){document.body.removeChild(modal);}; qrBox.appendChild(closeBtn);

  modal.appendChild(qrBox); document.body.appendChild(modal);
}

window.onload=function(){
  renderInventory();
  startScanner();
  document.getElementById('addBtn').addEventListener('click', addInventory);
};

function startScanner(){
  if(!window.Html5Qrcode) return;
  const reader=new Html5Qrcode('reader');
  reader.start({facingMode:'environment'},{fps:10,qrbox:250},decoded=>{
    if(inventory[decoded]>0){ inventory[decoded]-=1; saveInventory(); salesHistory.push({sku:decoded,date:new Date()}); localStorage.setItem('salesHistory',JSON.stringify(salesHistory)); alert(`✅ 1 piece deducted: ${decoded}`); renderInventory(); } else alert(`❌ No stock for ${decoded}`);
  },err=>{});
}
