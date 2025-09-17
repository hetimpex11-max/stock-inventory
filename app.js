let inventory = JSON.parse(localStorage.getItem("inventory")) || {};
let salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];

function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
  renderInventory();
}
function saveSalesHistory() { localStorage.setItem("salesHistory", JSON.stringify(salesHistory)); }

function makeSKU(design, style, color, size) { return `${design}-${style}-${color}-${size}`.toUpperCase(); }

function addInventory() {
  const design = document.getElementById("designNumber").value.trim();
  const style = document.getElementById("style").value.trim();
  const color = document.getElementById("color").value.trim();
  const size = document.getElementById("size").value.trim();
  const pieces = parseInt(document.getElementById("pieces").value);
  if (!design || !style || !color || !size || isNaN(pieces)) return alert("Enter valid data");

  const sku = makeSKU(design, style, color, size);
  inventory[sku] = (inventory[sku] || 0) + pieces;
  saveInventory();
  generateCodes(sku, design);
}

function generateCodes(sku, design) {
  const codesDiv = document.getElementById("codes");
  codesDiv.innerHTML = "";
  QRCode.toCanvas(document.createElement("canvas"), sku, (err, canvas) => {
    if (!err) {
      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");
      finalCanvas.width = canvas.width; finalCanvas.height = canvas.height + 30;
      ctx.drawImage(canvas,0,0); ctx.fillStyle="black"; ctx.font="16px Arial"; ctx.textAlign="center";
      ctx.fillText(design, finalCanvas.width/2, canvas.height+20); finalCanvas.id="qrCanvas";
      codesDiv.appendChild(finalCanvas);

      const dlBtn = document.createElement("button");
      dlBtn.textContent = "Download QR"; dlBtn.className="animated-btn";
      dlBtn.onclick = ()=>{ const link=document.createElement("a"); link.download=`${sku}-QR.png`; link.href=finalCanvas.toDataURL("image/png"); link.click(); };
      codesDiv.appendChild(dlBtn);
    }
  });
  const svg = document.createElement("svg"); JsBarcode(svg, sku,{format:"CODE128", displayValue:true}); codesDiv.appendChild(svg);
}

function toggleManualForm() { const form=document.getElementById("manualForm"); form.style.display=form.style.display==="none"?"block":"none"; }

function manualAdjust() {
  const design=document.getElementById("manualDesign").value.trim();
  const style=document.getElementById("manualStyle").value.trim();
  const color=document.getElementById("manualColor").value.trim();
  const size=document.getElementById("manualSize").value.trim();
  const stock=parseInt(document.getElementById("manualStock").value);
  if(!design||!style||!color||!size||isNaN(stock)) return alert("Enter valid details");
  const sku=makeSKU(design,style,color,size);
  inventory[sku]=stock; saveInventory();
}

function renderInventory() {
  const query=document.getElementById("searchInput").value.trim().toLowerCase();
  const list=document.getElementById("inventoryList"); list.innerHTML="";
  let table=document.createElement("table"); table.className="inventory-table";
  table.innerHTML=`<tr><th>Design #</th><th>Style</th><th>Color</th><th>Size</th><th>Stock</th></tr>`;
  let totalPieces=0;
  for(let sku in inventory){
    const [design,style,color,size]=sku.split("-");
    const stock=inventory[sku];
    if(design.toLowerCase().includes(query)||style.toLowerCase().includes(query)||color.toLowerCase().includes(query)||size.toLowerCase().includes(query)){
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${design}</td><td>${style}</td><td>${color}</td><td>${size}</td><td class="${stock<5?'low-stock':''}">${stock}</td>`;
      table.appendChild(tr); totalPieces+=stock;
    }
  }
  list.appendChild(table);
  const totalDiv=document.createElement("div"); totalDiv.className="total-pieces"; totalDiv.textContent=`Total Pieces in Stock: ${totalPieces}`;
  list.appendChild(totalDiv);
}
document.getElementById("searchInput").addEventListener("input",renderInventory);

function startScanner() {
  const reader=new Html5Qrcode("reader");
  reader.start({facingMode:"environment"},{fps:10,qrbox:250},decodedText=>{
    if(inventory[decodedText]>0){ inventory[decodedText]-=1; saveInventory(); alert(`✅ 1 piece deducted from ${decodedText}`); salesHistory.push({sku:decodedText,date:new Date()}); saveSalesHistory(); }
    else alert(`❌ No stock for ${decodedText}`);
  },err=>{});
}
window.onload=function(){ renderInventory(); startScanner(); };
