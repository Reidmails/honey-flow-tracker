document.addEventListener('DOMContentLoaded', () => {
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyCu8xALtuhNho73433ke4_Zko67g7QWdkI",
      authDomain: "honeyflow-fhmis.firebaseapp.com",
      databaseURL: "https://honeyflow-fhmis-default-rtdb.firebaseio.com",
      projectId: "honeyflow-fhmis",
      storageBucket: "honeyflow-fhmis.firebasestorage.app",
      messagingSenderId: "138664404827",
      appId: "1:138664404827:web:d6fa319d5dda6f616a1c7e"
    };

  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);


  const database = firebase.database();

  // --- DOM Element References ---
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');

  // Pricing Tab Elements
  const price12ozInput = document.getElementById('price-12oz');
  const price2lbInput = document.getElementById('price-2lb');
  const priceChapstickInput = document.getElementById('price-chapstick');
  const savePricesBtn = document.getElementById('save-prices-btn');

  // Sales Tab Elements
  const customerNameInput = document.getElementById('customer-name');
  const saleDateInput = document.getElementById('sale-date');
  const saleLocationInput = document.getElementById('sale-location');
  const quantity12ozInput = document.getElementById('quantity-12oz');
  const quantity2lbInput = document.getElementById('quantity-2lb');
  const quantityChapstickInput = document.getElementById('quantity-chapstick');
  const giftCheckbox = document.getElementById('gift-checkbox');
  const manualCostSection = document.getElementById('manual-cost-section');
  const manualTotalCostInput = document.getElementById('manual-total-cost');
  const totalCostDisplay = document.getElementById('total-cost-display');
  const recordSaleBtn = document.getElementById('record-sale-btn');

  // History Tab Elements
  const historyTableBody = document.getElementById('history-table-body');

  // Expense Tab Elements
  const expenseNameInput = document.getElementById('expense-name');
  const expenseDateInput = document.getElementById('expense-date');
  const expensePriceInput = document.getElementById('expense-price');
  const expenseNotesInput = document.getElementById('expense-notes');
  const recordExpenseBtn = document.getElementById('record-expense-btn');
  const expenseHistoryTableBody = document.getElementById('expense-history-table-body');
  const totalExpensesDisplay = document.getElementById('total-expenses-display');

  // --- Global State ---
  let currentPrices = { '12oz': 0, '2lb': 0, 'chapstick': 0 };

  // --- Functions ---

  // Function to switch tabs
  function switchTab(targetTabId) {
      tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === targetTabId) {
              content.classList.add('active');
          }
      });
      tabLinks.forEach(link => {
          link.classList.remove('active');
          if (link.dataset.tab === targetTabId) {
              link.classList.add('active');
          }
      });
  }

  // Function to load prices from Firebase
  function loadPrices() {
      const pricesRef = database.ref('prices');
      pricesRef.once('value')
          .then((snapshot) => {
              if (snapshot.exists()) {
                  const prices = snapshot.val();
                  currentPrices['12oz'] = parseFloat(prices['12oz'] || 0);
                  currentPrices['2lb'] = parseFloat(prices['2lb'] || 0);
                  currentPrices['chapstick'] = parseFloat(prices['chapstick'] || 0);
                  price12ozInput.value = currentPrices['12oz'].toFixed(2);
                  price2lbInput.value = currentPrices['2lb'].toFixed(2);
                  priceChapstickInput.value = currentPrices['chapstick'].toFixed(2);
                  console.log("Prices loaded successfully:", currentPrices);
              } else {
                  console.log("No prices found in database, using defaults.");
                  // Keep default 0 prices, update inputs if needed
                  price12ozInput.value = '0.00';
                  price2lbInput.value = '0.00';
              }
               // Calculate cost in case sales tab is active on load
               calculateTotalCost();
          })
          .catch((error) => {
              console.error("Error loading prices:", error);
              alert("Error loading prices from Firebase. Using default prices (0) for this session.");
              // Keep default 0 prices
              currentPrices = { '12oz': 0, '2lb': 0 };
              price12ozInput.value = '0.00';  
               price2lbInput.value = '0.00';
               priceChapstickInput.value = '0.00';
              calculateTotalCost(); // Recalculate with defaults
          }); 
  }

  // Function to save prices to Firebase
  function savePrices() {
      const price12oz = parseFloat(price12ozInput.value) || 0;
      const price2lb = parseFloat(price2lbInput.value) || 0;

      const priceChapstick = parseFloat(priceChapstickInput.value) || 0;
      // Basic validation
      if (price12oz < 0 || price2lb < 0) {
           alert("Prices cannot be negative.");
           return;
      }

      const pricesRef = database.ref('prices');
      pricesRef.set({
          '12oz': price12oz,
          '2lb': price2lb,
          'chapstick': priceChapstick
      })
      .then(() => {
          alert("Prices saved successfully!");
          currentPrices = { '12oz': price12oz, '2lb': price2lb, 'chapstick': priceChapstick };
          console.log("Prices updated:", currentPrices);
           calculateTotalCost(); // Recalculate in case sales tab uses new prices
      })
      .catch((error) => {
          console.error("Error saving prices:", error);
          alert("Error saving prices. Please try again.");
      });
  }

  // Function to calculate total cost on Sales tab
  function calculateTotalCost() {
      const qty12oz = parseInt(quantity12ozInput.value) || 0;
      const qty2lb = parseInt(quantity2lbInput.value) || 0;
      const qtyChapstick = parseInt(quantityChapstickInput.value) || 0;
      const isGift = giftCheckbox.checked;

      let totalCost = 0;

      if (isGift) {
          // If gift, check manual input
          const manualCost = parseFloat(manualTotalCostInput.value);
           // Use manual cost only if it's a valid, non-negative number
           if (!isNaN(manualCost) && manualCost >= 0) {
              totalCost = manualCost;
          } else {
              // Default to 0 if manual input is empty or invalid when gift is checked
              totalCost = 0;
          }
      } else {
          // Calculate based on loaded prices and quantities
          totalCost = (qty12oz * currentPrices['12oz']) + (qty2lb * currentPrices['2lb']) + (qtyChapstick * currentPrices['chapstick']);
      }

      totalCostDisplay.textContent = totalCost.toFixed(2); // Format to 2 decimal places
  }

  // Function to record a sale to Firebase
  function recordSale() {
      const customer = customerNameInput.value.trim();
      const date = saleDateInput.value;
      const location = saleLocationInput.value.trim();
      const qty12oz = parseInt(quantity12ozInput.value) || 0;
      const qty2lb = parseInt(quantity2lbInput.value) || 0;
      const qtyChapstick = parseInt(quantityChapstickInput.value) || 0;
      const isGift = giftCheckbox.checked;

      // Recalculate final cost just before saving
      calculateTotalCost(); // Ensures display is up-to-date
      const totalCost = parseFloat(totalCostDisplay.textContent); // Read the final calculated cost

      // Basic Validation
      if (!customer) {
          alert("Please enter a customer name.");
          return;
      }
      if (!date) {
          alert("Please select a date.");
          return;
      }
       if (qty12oz <= 0 && qty2lb <= 0 && qtyChapstick <= 0) {
           alert("Please enter a quantity for at least one item type.");
           return;
       }

      // Store prices at the time of sale
      const price12oz = currentPrices['12oz'];
      const price2lb = currentPrices['2lb'];
      const priceChapstick = currentPrices['chapstick'];

      // Calculate original cost (without gift)
      const originalCost = (qty12oz * price12oz) + (qty2lb * price2lb);

      const saleData = {
          customer: customer,
          price12oz: price12oz,
          price2lb: price2lb,
          date: date,
          location: location || 'N/A', // Default if empty
          qty12oz: qty12oz,
          qty2lb: qty2lb,
          qtyChapstick: qtyChapstick,
          priceChapstick: priceChapstick,
          totalCost: totalCost,
          isGift: isGift,
          timestamp: firebase.database.ServerValue.TIMESTAMP, // Optional: for sorting later if needed
          originalCost: originalCost,};    

      const salesRef = database.ref('sales');
      salesRef.push(saleData)
          .then(() => {
              alert("Sale recorded successfully!");
              // Clear the form
              customerNameInput.value = '';
              // Keep today's date as default
              setDefaultDate();
              saleLocationInput.value = '';
              quantity12ozInput.value = '0';
              quantity2lbInput.value = '0';
              quantityChapstickInput.value = '0';
              giftCheckbox.checked = false;
              manualTotalCostInput.value = '';
              manualCostSection.style.display = 'none';
              calculateTotalCost(); // Reset total cost display
          })
          .catch((error) => {
              console.error("Error recording sale:", error);
              alert("Error recording sale. Please try again.");
          });
  }

  // Function to load and display sales history
  function loadSalesHistory() {
    const salesRef = database.ref('sales'); //.orderByChild('timestamp'); // Optional: Sort by timestamp

    salesRef.on('value', (snapshot) => {
          historyTableBody.innerHTML = ''; // Clear existing table data
          if (snapshot.exists()) {
              snapshot.forEach((childSnapshot) => {
                  const sale = childSnapshot.val();
                  const saleKey = childSnapshot.key; // Get unique key if needed later

                  const row = document.createElement('tr');

                  //Add row id
                   row.id = `row-${saleKey}`;

                    
                  

                  // Items String
                  let itemsStr = '';
                   if (sale.qty12oz > 0) itemsStr += `${sale.qty12oz} x 12 oz`;
                   if (sale.qty12oz > 0 && sale.qty2lb > 0) itemsStr += ', ';
                   if (sale.qty2lb > 0) itemsStr += `${sale.qty2lb} x 2 lb`;
                   if ((sale.qty12oz > 0 || sale.qty2lb > 0) && sale.qtyChapstick > 0) itemsStr += ', ';
                   if (sale.qtyChapstick > 0) itemsStr += `${sale.qtyChapstick} x Chapstick`;
                   if (!itemsStr) itemsStr = 'N/A'; // Should not happen if validation works

                  const originalCost = (sale.qty12oz * sale.price12oz) + (sale.qty2lb * sale.price2lb);
                  let giftPriceCell = "";
                  let salePrice = originalCost;
                  if(sale.isGift)
                  {
                      giftPriceCell = `$${parseFloat(sale.totalCost).toFixed(2)}`;
                      salePrice = sale.totalCost;
                  }
                  
                  row.innerHTML = `
                      <td>${escapeHtml(sale.customer)}</td>
                      <td>${escapeHtml(sale.date)}</td>
                      <td>${escapeHtml(sale.location)}</td>
                      <td>${escapeHtml(itemsStr)}</td>
                      <td>$${parseFloat(originalCost).toFixed(2)}</td> 
                      <td>${giftPriceCell}</td>
                      <td>$${parseFloat(salePrice).toFixed(2)}</td>                      
                      <td>
                            <button id="delete-${saleKey}" data-sale-key="${saleKey}">Delete</button>
                      </td>
                  `;
                   historyTableBody.appendChild(row);
                  
                  // Add event listener to the delete button
                  const deleteButton = document.getElementById(`delete-${saleKey}`);
                   deleteButton.addEventListener('click', () => {
                       // Get the sale key from the data attribute
                       const saleKey = deleteButton.dataset.saleKey;

                       // Ask for confirmation
                       const confirmation = prompt("Type 'delete' to confirm:");

                       // Check if the user confirmed
                       if (confirmation && confirmation.toLowerCase() === 'delete') {
                           deleteSale(saleKey);
                       }
                   });
                  });
          } else{
              historyTableBody.innerHTML = '<tr><td colspan="6">No sales recorded yet.</td></tr>';
          }
    
  function deleteSale(saleKey) {
      const saleRef = database.ref('sales/' + saleKey);
      saleRef.remove()
          .then(() => {
               alert('Sale deleted');

          })
          .catch((error) => alert("Error deleting sale", error));
  }
    }, (error) => {
        console.error("Error loading sales history:", error);
          alert("Error loading sales history.", error);
           historyTableBody.innerHTML = '<tr><td colspan="6">Error loading history.</td></tr>';
      });
  }

  // Function to record an expense to Firebase
  function recordExpense() {
      const expenseName = expenseNameInput.value.trim();
      const expenseDate = expenseDateInput.value;
      const expensePrice = parseFloat(expensePriceInput.value) || 0;
      const expenseNotes = expenseNotesInput.value.trim();

      // Basic Validation
      if (!expenseName) {
          alert("Please enter an expense name.");
          return;
      }
      if (!expenseDate) {
          alert("Please select a date.");
          return;
      }
      if (expensePrice <= 0) {
          alert("Please enter a valid price.");
          return;
      }

      const expenseData = {
          name: expenseName,
          date: expenseDate,
          price: expensePrice,
          notes: expenseNotes,
          timestamp: firebase.database.ServerValue.TIMESTAMP
      };

      const expensesRef = database.ref('expenses');
      expensesRef.push(expenseData)
          .then(() => {
              alert("Expense recorded successfully!");
              // Clear the form
              expenseNameInput.value = '';
              expenseDateInput.value = '';
              expensePriceInput.value = '';
              expenseNotesInput.value = '';
              loadExpenseHistory(); // Refresh history
          })
          .catch((error) => {
              console.error("Error recording expense:", error);
              alert("Error recording expense. Please try again.");
          });
  }

  // Function to load and display expense history
  function loadExpenseHistory() {
      const expensesRef = database.ref('expenses');

      expensesRef.on('value', (snapshot) => {
          expenseHistoryTableBody.innerHTML = ''; // Clear existing table data
          let totalExpenses = 0;

          if (snapshot.exists()) {
              snapshot.forEach((childSnapshot) => {
                  const expense = childSnapshot.val();
                  const expenseKey = childSnapshot.key;

                  const row = document.createElement('tr');
                  row.id = `row-${expenseKey}`;

                  row.innerHTML = `
                      <td>${escapeHtml(expense.name)}</td>
                      <td>${escapeHtml(expense.date)}</td>
                      <td>$${parseFloat(expense.price).toFixed(2)}</td>
                      <td>${escapeHtml(expense.notes || 'N/A')}</td>
                      <td>
                          <button id="delete-expense-${expenseKey}" data-expense-key="${expenseKey}">Delete</button>
                      </td>
                  `;

                  expenseHistoryTableBody.appendChild(row);

                  // Add event listener to the delete button
                  const deleteButton = document.getElementById(`delete-expense-${expenseKey}`);
                  deleteButton.addEventListener('click', () => {
                      const confirmation = prompt("Type 'delete' to confirm:");
                      if (confirmation && confirmation.toLowerCase() === 'delete') {
                          deleteExpense(expenseKey);
                      }
                  });

                  totalExpenses += expense.price;
              });
          } else {
              expenseHistoryTableBody.innerHTML = '<tr><td colspan="5">No expenses recorded yet.</td></tr>';
          }

          totalExpensesDisplay.textContent = `$${totalExpenses.toFixed(2)}`;
      }, (error) => {
          console.error("Error loading expense history:", error);
          alert("Error loading expense history.");
          expenseHistoryTableBody.innerHTML = '<tr><td colspan="5">Error loading history.</td></tr>';
      });
  }

  // Function to delete an expense
  function deleteExpense(expenseKey) {
      const expenseRef = database.ref('expenses/' + expenseKey);
      expenseRef.remove()
          .then(() => {
              alert('Expense deleted');
              loadExpenseHistory(); // Refresh history
          })
          .catch((error) => alert("Error deleting expense", error));
  }

  // Function to set default date to today
  function setDefaultDate() {
      const today = new Date();
      // Format date as YYYY-MM-DD for the input type="date"
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(today.getDate()).padStart(2, '0');
      saleDateInput.value = `${year}-${month}-${day}`;
  }

  // Helper function to prevent basic XSS risks (always good practice)
  function escapeHtml(unsafe) {
      if (typeof unsafe !== 'string') return unsafe; // Handle non-strings gracefully
      return unsafe
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
  }

  // --- Event Listeners ---

  // Tab switching
  tabLinks.forEach(link => {
      link.addEventListener('click', () => {
          const targetTabId = link.dataset.tab;
          switchTab(targetTabId);
      });
  });

  // Pricing Tab: Save Prices
  savePricesBtn.addEventListener('click', savePrices);

  // Sales Tab: Calculate total cost dynamically
  quantity12ozInput.addEventListener('input', calculateTotalCost);
  quantity2lbInput.addEventListener('input', calculateTotalCost);
  quantityChapstickInput.addEventListener('input', calculateTotalCost);
  giftCheckbox.addEventListener('change', () => {
      manualCostSection.style.display = giftCheckbox.checked ? 'block' : 'none';
      // Clear manual cost input when unchecking gift box
      if (!giftCheckbox.checked) {
          manualTotalCostInput.value = '';
      }
      calculateTotalCost();
  });
  manualTotalCostInput.addEventListener('input', () => {
       // Only recalculate based on manual input if the gift box IS checked
       if(giftCheckbox.checked) {
           calculateTotalCost();
       }
  });


  // Sales Tab: Record Sale
  recordSaleBtn.addEventListener('click', recordSale);

  // Expense Tab: Record Expense
  recordExpenseBtn.addEventListener('click', recordExpense);

  // --- Initial Load ---
  setDefaultDate();
  loadPrices();      // Load prices first as they are needed for calculation
  loadSalesHistory(); // Load history
  loadExpenseHistory(); // Load expense history
  switchTab('sales-tab'); // Ensure Sales tab is active on load

}); // End DOMContentLoaded