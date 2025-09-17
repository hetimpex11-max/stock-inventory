window.onload = function() {
  const inventory = JSON.parse(localStorage.getItem('inventory')) || {};
  const salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];

  // Compute sales counts
  const salesCount = {};
  salesHistory.forEach(sale => {
    salesCount[sale.sku] = (salesCount[sale.sku] || 0) + 1;
  });

  // --- Current Inventory Stock ---
  const inventoryDiv = document.getElementById('currentInventory');
  let invHtml = `<table class='inventory-table'><tr><th>SKU</th><th>Stock</th></tr>`;
  Object.keys(inventory).forEach(sku => {
    invHtml += `<tr><td>${sku}</td><td style='color:${inventory[sku]<5?'#d32f2f':'#388e3c'}'>${inventory[sku]}</td></tr>`;
  });
  invHtml += '</table>';
  inventoryDiv.innerHTML = invHtml;

  // --- Fastest Selling Products ---
  const fastDiv = document.getElementById('fastSelling');
  const sortedSales = Object.entries(salesCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  if(sortedSales.length>0){
    fastDiv.innerHTML=`<canvas id='fastChart'></canvas>`;
    new Chart(document.getElementById('fastChart').getContext('2d'),{
      type:'bar',
      data:{
        labels: sortedSales.map(e=>e[0]),
        datasets:[{
          label:'Units Sold',
          data: sortedSales.map(e=>e[1]),
          backgroundColor:'rgba(255,99,132,0.7)',
          borderColor:'rgba(255,99,132,1)',
          borderWidth:1
        }]
      },
      options:{responsive:true, animation:{duration:1500}, scales:{y:{beginAtZero:true}}}
    });
  } else fastDiv.innerHTML = '<p>No sales data yet.</p>';

  // --- Inventory Turnover & Stock Alerts ---
  const turnoverDiv = document.getElementById('turnover');
  const turnoverData = Object.keys(inventory).map(sku=>({sku, stock:inventory[sku], sold:salesCount[sku]||0}));
  turnoverDiv.innerHTML = `<canvas id='turnoverChart'></canvas>`;
  new Chart(document.getElementById('turnoverChart').getContext('2d'),{
    type:'line',
    data:{
      labels: turnoverData.map(e=>e.sku),
      datasets:[
        {label:'Stock', data:turnoverData.map(e=>e.stock), borderColor:'rgba(54,162,235,1)', backgroundColor:'rgba(54,162,235,0.2)', tension:0.3},
        {label:'Sold', data:turnoverData.map(e=>e.sold), borderColor:'rgba(255,206,86,1)', backgroundColor:'rgba(255,206,86,0.2)', tension:0.3}
      ]
    },
    options:{responsive:true, animation:{duration:1500}, plugins:{legend:{position:'top'}}}
  });

  // --- Demand Forecasting (simple +20%) ---
  const forecastDiv = document.getElementById('forecast');
  forecastDiv.innerHTML = `<canvas id='forecastChart'></canvas>`;
  new Chart(document.getElementById('forecastChart').getContext('2d'),{
    type:'bar',
    data:{
      labels: turnoverData.map(e=>e.sku),
      datasets:[{label:'Forecasted Demand',data:turnoverData.map(e=>Math.ceil(e.sold*1.2)),backgroundColor:'rgba(75,192,192,0.7)',borderColor:'rgba(75,192,192,1)',borderWidth:1}]
    },
    options:{responsive:true, animation:{duration:1500}, scales:{y:{beginAtZero:true}}}
  });

  // --- Customer Behavior & SKU Analysis ---
  const skuDiv = document.getElementById('skuAnalysis');
  let skuHtml = `<table class='inventory-table'><tr><th>SKU</th><th>Units Sold</th><th>Current Stock</th><th>Low Stock</th></tr>`;
  turnoverData.forEach(e=>{
    skuHtml += `<tr><td>${e.sku}</td><td>${e.sold}</td><td>${e.stock}</td><td style='color:${e.stock<5?'#d32f2f':'#388e3c'}'>${e.stock<5?'Yes':'No'}</td></tr>`;
  });
  skuHtml += '</table>';
  skuDiv.innerHTML = skuHtml;
};