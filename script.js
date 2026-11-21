/* =========================================================
   RISHI EXPENSE MANAGER      script.js
   Main Application
   ========================================================= */


/* =========================================================
   DATA
   ========================================================= */

const STORAGE_KEY = "rishi_expense_manager_v3";


const defaultCategories = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Bills",
    "Education",
    "Entertainment",
    "Health",
    "Salary",
    "Other"
];


let state = {

    startingBalance: 0,

    transactions: [],

    budgets: [],

    goals: [],

    recurring: [],

    categories: [...defaultCategories],

    settings: {
        currency: "₹",
        darkMode: false
    }

};


let editingId = null;


/* =========================================================
   DOM HELPER
   ========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   STORAGE
   ========================================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );

}


function loadData() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return;
    }

    try {

        const data = JSON.parse(saved);

        state = {
            ...state,
            ...data,
            settings: {
                ...state.settings,
                ...(data.settings || {})
            }
        };

        if (!Array.isArray(state.transactions)) {
            state.transactions = [];
        }

        if (!Array.isArray(state.categories)) {
            state.categories = [...defaultCategories];
        }

    } catch (error) {

        console.error(
            "Could not load data",
            error
        );

    }

}


/* =========================================================
   CURRENCY
   ========================================================= */

function money(value) {

    const number =
        Number(value) || 0;

    return (
        state.settings.currency +
        number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );

}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function todayString() {

    const d = new Date();

    const year =
        d.getFullYear();

    const month =
        String(d.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(d.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function currentMonthString() {

    return todayString().slice(0, 7);

}


function formatDate(date) {

    if (!date) {
        return "";
    }

    const d =
        new Date(date + "T00:00:00");

    return d.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function isToday(date) {

    return date === todayString();

}


function isThisMonth(date) {

    return date &&
        date.slice(0, 7) ===
        currentMonthString();

}


function isThisYear(date) {

    return date &&
        date.slice(0, 4) ===
        String(new Date().getFullYear());

}


function isThisWeek(date) {

    const target =
        new Date(date + "T00:00:00");

    const now =
        new Date();

    const day =
        now.getDay();

    const diff =
        day === 0 ? 6 : day - 1;

    const monday =
        new Date(now);

    monday.setHours(0, 0, 0, 0);

    monday.setDate(
        now.getDate() - diff
    );

    const sunday =
        new Date(monday);

    sunday.setDate(
        monday.getDate() + 6
    );

    sunday.setHours(
        23,
        59,
        59,
        999
    );

    return (
        target >= monday &&
        target <= sunday
    );

}


/* =========================================================
   CALCULATIONS
   ========================================================= */

function totalIncome(transactions = state.transactions) {

    return transactions
        .filter(t => t.type === "income")
        .reduce(
            (sum, t) =>
                sum + Number(t.amount),
            0
        );

}


function totalExpenses(transactions = state.transactions) {

    return transactions
        .filter(t => t.type === "expense")
        .reduce(
            (sum, t) =>
                sum + Number(t.amount),
            0
        );

}


function currentBalance() {

    return (
        Number(state.startingBalance) +
        totalIncome() -
        totalExpenses()
    );

}


function netSavings(transactions = state.transactions) {

    return (
        totalIncome(transactions) -
        totalExpenses(transactions)
    );

}


function expensesFor(filterFunction) {

    return state.transactions
        .filter(
            t =>
                t.type === "expense" &&
                filterFunction(t.date)
        )
        .reduce(
            (sum, t) =>
                sum + Number(t.amount),
            0
        );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    const toast = $("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(
            () => {
                toast.classList.remove("show");
            },
            2500
        );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

const pageTitles = {

    dashboard: [
        "Dashboard",
        "Your financial overview"
    ],

    transactions: [
        "Transactions",
        "Search, filter and manage transactions"
    ],

    add: [
        "Add Transaction",
        "Record income or expenses"
    ],

    daily: [
        "Daily",
        "Today's financial activity"
    ],

    weekly: [
        "Weekly",
        "Your weekly financial summary"
    ],

    monthly: [
        "Monthly",
        "Your monthly financial summary"
    ],

    analytics: [
        "Analytics",
        "Understand your financial patterns"
    ],

    budgets: [
        "Budgets",
        "Control your spending"
    ],

    goals: [
        "Savings Goals",
        "Track your savings"
    ],

    recurring: [
        "Recurring Payments",
        "Track regular payments"
    ],

    categories: [
        "Categories",
        "Organize your spending"
    ],

    reports: [
        "Reports",
        "Generate financial reports"
    ],

    backup: [
        "Backup & Restore",
        "Protect your data"
    ],

    settings: [
        "Settings",
        "Customize your app"
    ]

};


function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {
            section.classList.remove("active");
        });


    const target =
        $("page-" + page);

    if (target) {
        target.classList.add("active");
    }


    document
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );

        });


    const info =
        pageTitles[page] ||
        pageTitles.dashboard;

    $("pageTitle").textContent =
        info[0];

    $("pageSubtitle").textContent =
        info[1];


    $("sidebar").classList.remove("open");


    if (page === "dashboard") {
        renderDashboard();
    }

    if (page === "transactions") {
        renderTransactions();
    }

    if (page === "daily") {
        renderDaily();
    }

    if (page === "weekly") {
        renderWeekly();
    }

    if (page === "monthly") {
        renderMonthly();
    }

    if (page === "analytics") {
        renderAnalytics();
    }

    if (page === "budgets") {
        renderBudgets();
    }

    if (page === "goals") {
        renderGoals();
    }

    if (page === "recurring") {
        renderRecurring();
    }

    if (page === "categories") {
        renderCategories();
    }

    if (page === "reports") {
        renderReports();
    }

}


/* =========================================================
   BALANCE
   ========================================================= */

function updateBalanceDisplay() {

    $("dashboardBalance").textContent =
        money(currentBalance());

    $("startingAmount").textContent =
        money(state.startingBalance);

    $("totalIncome").textContent =
        money(totalIncome());

    $("totalExpense").textContent =
        money(totalExpenses());

    $("totalTransactions").textContent =
        state.transactions.length;

    if (currentBalance() >= 0) {

        $("balanceMessage").textContent =
            "Your available money";

    } else {

        $("balanceMessage").textContent =
            "Your expenses are higher than available funds";

    }

}


function openBalanceModal() {

    $("startingBalanceInput").value =
        state.startingBalance;

    $("balanceModal")
        .classList.add("show");

}


function closeBalanceModal() {

    $("balanceModal")
        .classList.remove("show");

}


function saveBalance() {

    const value =
        Number(
            $("startingBalanceInput").value
        );

    if (value < 0) {

        showToast(
            "Amount cannot be negative"
        );

        return;
    }

    state.startingBalance =
        value;

    saveData();

    updateBalanceDisplay();

    closeBalanceModal();

    showToast(
        "Amount I Have saved"
    );

}


/* =========================================================
   CATEGORY SELECTS
   ========================================================= */

function populateCategories() {

    const categorySelect =
        $("category");

    const filter =
        $("categoryFilter");


    categorySelect.innerHTML =
        state.categories
            .map(
                category =>
                    `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
            )
            .join("");


    filter.innerHTML =
        `<option value="all">All Categories</option>` +
        state.categories
            .map(
                category =>
                    `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
            )
            .join("");

}


/* =========================================================
   ADD TRANSACTION
   ========================================================= */

function resetTransactionForm() {

    $("transactionForm").reset();

    $("date").value =
        todayString();

    $("time").value =
        new Date()
            .toTimeString()
            .slice(0, 5);

    $("transactionType").value =
        "expense";

    $("submitBtn").textContent =
        "Add Transaction";

    $("cancelEditBtn")
        .classList.add("hidden");

    editingId = null;

}


function editTransaction(id) {

    const transaction =
        state.transactions.find(
            t => t.id === id
        );

    if (!transaction) {
        return;
    }

    editingId = id;

    $("title").value =
        transaction.title;

    $("transactionType").value =
        transaction.type;

    $("amount").value =
        transaction.amount;

    $("category").value =
        transaction.category;

    $("paymentMethod").value =
        transaction.paymentMethod ||
        "Cash";

    $("date").value =
        transaction.date;

    $("time").value =
        transaction.time || "";

    $("note").value =
        transaction.note || "";

    $("submitBtn").textContent =
        "Update Transaction";

    $("cancelEditBtn")
        .classList.remove("hidden");

    showPage("add");

}


function deleteTransaction(id) {

    const transaction =
        state.transactions.find(
            t => t.id === id
        );

    if (!transaction) {
        return;
    }

    if (
        !confirm(
            `Delete "${transaction.title}"?`
        )
    ) {
        return;
    }

    state.transactions =
        state.transactions.filter(
            t => t.id !== id
        );

    saveData();

    renderDashboard();

    renderTransactions();

    showToast(
        "Transaction deleted"
    );

}


function submitTransaction(event) {

    event.preventDefault();


    const title =
        $("title").value.trim();

    const amount =
        Number(
            $("amount").value
        );

    if (!title || amount <= 0) {

        showToast(
            "Enter a valid title and amount"
        );

        return;
    }


    const transaction = {

        id:
            editingId ||
            Date.now().toString(),

        title,

        type:
            $("transactionType").value,

        amount,

        category:
            $("category").value,

        paymentMethod:
            $("paymentMethod").value,

        date:
            $("date").value,

        time:
            $("time").value,

        note:
            $("note").value.trim()

    };


    if (editingId) {

        const index =
            state.transactions.findIndex(
                t => t.id === editingId
            );

        if (index !== -1) {

            state.transactions[index] =
                transaction;

        }

        showToast(
            "Transaction updated"
        );

    } else {

        state.transactions.unshift(
            transaction
        );

        showToast(
            "Transaction added"
        );

    }


    saveData();

    resetTransactionForm();

    updateBalanceDisplay();

    renderDashboard();

    showPage("transactions");

    renderTransactions();

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   TRANSACTION HTML
   ========================================================= */

function transactionHTML(t) {

    const sign =
        t.type === "income"
            ? "+"
            : "-";

    const icon =
        t.type === "income"
            ? "📈"
            : "💸";


    return `

        <div class="transaction-item">

            <div class="transaction-icon">
                ${icon}
            </div>

            <div class="transaction-info">

                <strong>
                    ${escapeHtml(t.title)}
                </strong>

                <small>
                    ${escapeHtml(t.category)}
                    •
                    ${formatDate(t.date)}
                    ${t.paymentMethod
                        ? " • " +
                          escapeHtml(t.paymentMethod)
                        : ""
                    }
                </small>

                ${
                    t.note
                        ? `<small>${escapeHtml(t.note)}</small>`
                        : ""
                }

            </div>


            <div
                class="transaction-amount ${t.type}"
            >
                ${sign}${money(t.amount)}
            </div>


            <div class="transaction-actions">

                <button
                    class="icon-btn"
                    onclick="editTransaction('${t.id}')"
                    title="Edit"
                >
                    ✏
                </button>

                <button
                    class="icon-btn"
                    onclick="deleteTransaction('${t.id}')"
                    title="Delete"
                >
                    🗑
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   FILTER TRANSACTIONS
   ========================================================= */

function getFilteredTransactions() {

    let result =
        [...state.transactions];


    const search =
        $("searchInput")
            .value
            .trim()
            .toLowerCase();


    const type =
        $("typeFilter").value;

    const category =
        $("categoryFilter").value;

    const period =
        $("periodFilter").value;

    const sort =
        $("sortFilter").value;


    if (search) {

        result =
            result.filter(t =>

                t.title
                    .toLowerCase()
                    .includes(search)

                ||

                t.category
                    .toLowerCase()
                    .includes(search)

                ||

                (t.note || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (t.paymentMethod || "")
                    .toLowerCase()
                    .includes(search)

            );

    }


    if (type !== "all") {

        result =
            result.filter(
                t => t.type === type
            );

    }


    if (category !== "all") {

        result =
            result.filter(
                t =>
                    t.category ===
                    category
            );

    }


    if (period === "today") {

        result =
            result.filter(
                t => isToday(t.date)
            );

    }


    if (period === "week") {

        result =
            result.filter(
                t => isThisWeek(t.date)
            );

    }


    if (period === "month") {

        result =
            result.filter(
                t => isThisMonth(t.date)
            );

    }


    if (period === "year") {

        result =
            result.filter(
                t => isThisYear(t.date)
            );

    }


    if (sort === "newest") {

        result.sort(
            (a, b) =>
                (
                    b.date + " " +
                    (b.time || "")
                ).localeCompare(
                    a.date + " " +
                    (a.time || "")
                )
        );

    }


    if (sort === "oldest") {

        result.sort(
            (a, b) =>
                (
                    a.date + " " +
                    (a.time || "")
                ).localeCompare(
                    b.date + " " +
                    (b.time || "")
                )
        );

    }


    if (sort === "highest") {

        result.sort(
            (a, b) =>
                Number(b.amount) -
                Number(a.amount)
        );

    }


    if (sort === "lowest") {

        result.sort(
            (a, b) =>
                Number(a.amount) -
                Number(b.amount)
        );

    }


    if (sort === "az") {

        result.sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title
                )
        );

    }


    return result;

}


/* =========================================================
   TRANSACTION PAGE
   ========================================================= */

function renderTransactions() {

    const list =
        $("transactionList");

    const transactions =
        getFilteredTransactions();


    $("transactionCount")
        .textContent =
        transactions.length;


    if (!transactions.length) {

        list.innerHTML = `

            <div class="empty-state">

                <span>🧾</span>

                <strong>
                    No transactions found
                </strong>

                <p>
                    Try changing your filters
                    or add a transaction.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML =
        transactions
            .map(transactionHTML)
            .join("");

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    updateBalanceDisplay();


    $("todayExpense").textContent =
        money(
            expensesFor(isToday)
        );


    $("weekExpense").textContent =
        money(
            expensesFor(isThisWeek)
        );


    $("monthExpense").textContent =
        money(
            expensesFor(isThisMonth)
        );


    $("yearExpense").textContent =
        money(
            expensesFor(isThisYear)
        );


    const recent =
        [...state.transactions]
            .sort(
                (a, b) =>
                    b.date.localeCompare(a.date)
            )
            .slice(0, 6);


    if (!recent.length) {

        $("recentTransactions").innerHTML = `

            <div class="empty-state">
                <span>🧾</span>
                No transactions yet.
            </div>

        `;

    } else {

        $("recentTransactions").innerHTML =
            recent
                .map(transactionHTML)
                .join("");

    }


    renderDashboardCategories();

    renderInsights();

}


/* =========================================================
   CATEGORY SPENDING
   ========================================================= */

function getCategoryTotals(
    transactions = state.transactions
) {

    const totals = {};

    transactions
        .filter(
            t => t.type === "expense"
        )
        .forEach(t => {

            totals[t.category] =
                (
                    totals[t.category] ||
                    0
                ) +
                Number(t.amount);

        });


    return totals;

}


function renderDashboardCategories() {

    const container =
        $("dashboardCategories");

    const totals =
        getCategoryTotals();


    const entries =
        Object.entries(totals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 7);


    if (!entries.length) {

        container.innerHTML =
            `<div class="empty-state">
                No expense data yet.
            </div>`;

        return;
    }


    const max =
        Math.max(
            ...entries.map(
                e => e[1]
            )
        );


    container.innerHTML =
        entries
            .map(
                ([category, amount]) => `

                    <div class="category-row">

                        <div class="category-top">

                            <span>
                                ${escapeHtml(category)}
                            </span>

                            <strong>
                                ${money(amount)}
                            </strong>

                        </div>

                        <div class="progress">

                            <div
                                style="width:${(amount / max) * 100}%"
                            ></div>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   INSIGHTS
   ========================================================= */

function renderInsights() {

    const container =
        $("insights");


    const expenses =
        totalExpenses();

    const income =
        totalIncome();


    let topCategory =
        "None";


    const totals =
        getCategoryTotals();


    const sorted =
        Object.entries(totals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    if (sorted.length) {
        topCategory =
            sorted[0][0];
    }


    container.innerHTML = `

        <div class="insight">
            💰 Your current balance is
            <strong>${money(currentBalance())}</strong>.
        </div>

        <div class="insight">
            🛒 Your highest spending category is
            <strong>${escapeHtml(topCategory)}</strong>.
        </div>

        <div class="insight">
            📊 Total spending is
            <strong>${money(expenses)}</strong>
            from recorded expenses.
        </div>

        <div class="insight">
            📈 Recorded income is
            <strong>${money(income)}</strong>.
        </div>

        <div class="insight">
            📅 This month's spending is
            <strong>${money(expensesFor(isThisMonth))}</strong>.
        </div>

        <div class="insight">
            💡 Net savings is
            <strong>${money(netSavings())}</strong>.
        </div>

    `;

}


/* =========================================================
   DAILY
   ========================================================= */

function renderDaily() {

    const date =
        $("dailyDate").value ||
        todayString();

    $("dailyDate").value =
        date;


    const transactions =
        state.transactions.filter(
            t => t.date === date
        );


    const income =
        totalIncome(transactions);

    const expenses =
        totalExpenses(transactions);


    $("dailyIncome").textContent =
        money(income);

    $("dailyExpenses").textContent =
        money(expenses);

    $("dailyTransactions").textContent =
        transactions.length;


    $("dailyList").innerHTML =
        transactions.length
            ? transactions
                .map(transactionHTML)
                .join("")
            : `
                <div class="empty-state">
                    <span>📅</span>
                    No transactions for this day.
                </div>
            `;

}


/* =========================================================
   WEEKLY
   ========================================================= */

function renderWeekly() {

    const transactions =
        state.transactions.filter(
            t => isThisWeek(t.date)
        );


    const income =
        totalIncome(transactions);

    const expenses =
        totalExpenses(transactions);


    $("weeklyIncome").textContent =
        money(income);

    $("weeklyExpenses").textContent =
        money(expenses);

    $("weeklySavings").textContent =
        money(income - expenses);


    const days = [];

    const now =
        new Date();


    for (let i = 6; i >= 0; i--) {

        const date =
            new Date(now);

        date.setDate(
            now.getDate() - i
        );


        const dateString =
            date.toISOString()
                .slice(0, 10);


        const amount =
            expensesFor(
                d => d === dateString
            );


        days.push({
            date: dateString,
            amount
        });

    }


    const max =
        Math.max(
            ...days.map(
                d => d.amount
            ),
            1
        );


    $("weeklyBreakdown").innerHTML =
        days.map(d => `

            <div class="chart-row">

                <div class="category-top">

                    <span>
                        ${formatDate(d.date)}
                    </span>

                    <strong>
                        ${money(d.amount)}
                    </strong>

                </div>

                <div class="progress">

                    <div
                        style="width:${(d.amount / max) * 100}%"
                    ></div>

                </div>

            </div>

        `).join("");

}


/* =========================================================
   MONTHLY
   ========================================================= */

function renderMonthly() {

    const month =
        $("monthlyMonth").value ||
        currentMonthString();


    $("monthlyMonth").value =
        month;


    const transactions =
        state.transactions.filter(
            t =>
                t.date &&
                t.date.slice(0, 7) ===
                month
        );


    const income =
        totalIncome(transactions);

    const expenses =
        totalExpenses(transactions);


    $("monthlyIncome").textContent =
        money(income);

    $("monthlyExpenses").textContent =
        money(expenses);

    $("monthlySavings").textContent =
        money(income - expenses);


    $("monthlyList").innerHTML =
        transactions.length
            ? transactions
                .map(transactionHTML)
                .join("")
            : `
                <div class="empty-state">
                    <span>🗓️</span>
                    No transactions in this month.
                </div>
            `;

}


/* =========================================================
   ANALYTICS
   ========================================================= */

function renderAnalytics() {

    renderMonthlyChart();

    renderCategoryChart();

    renderIncomeExpenseChart();

}


function renderMonthlyChart() {

    const container =
        $("monthlyChart");


    const months = [];

    const now =
        new Date();


    for (let i = 5; i >= 0; i--) {

        const d =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

        const key =
            d.toISOString()
                .slice(0, 7);

        months.push(key);

    }


    const values =
        months.map(
            month =>
                totalExpenses(
                    state.transactions.filter(
                        t =>
                            t.date &&
                            t.date.slice(0, 7) ===
                            month
                    )
                )
        );


    const max =
        Math.max(
            ...values,
            1
        );


    container.innerHTML =
        months.map(
            (month, index) => {

                const label =
                    new Date(
                        month + "-01"
                    ).toLocaleDateString(
                        "en-IN",
                        {
                            month: "short"
                        }
                    );


                return `

                    <div class="bar-item">

                        <div
                            class="bar"
                            style="height:${Math.max(
                                3,
                                (values[index] / max) * 190
                            )}px"
                            title="${money(values[index])}"
                        ></div>

                        <span>
                            ${label}
                        </span>

                    </div>

                `;

            }
        ).join("");

}


function renderCategoryChart() {

    const container =
        $("categoryChart");


    const totals =
        getCategoryTotals();


    const entries =
        Object.entries(totals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    if (!entries.length) {

        container.innerHTML =
            `<div class="empty-state">
                No category data.
            </div>`;

        return;
    }


    const max =
        entries[0][1];


    container.innerHTML =
        entries.map(
            ([category, amount]) => `

                <div class="chart-row">

                    <div class="category-top">

                        <span>
                            ${escapeHtml(category)}
                        </span>

                        <strong>
                            ${money(amount)}
                        </strong>

                    </div>

                    <div class="progress">

                        <div
                            style="width:${(amount / max) * 100}%"
                        ></div>

                    </div>

                </div>

            `
        ).join("");

}


function renderIncomeExpenseChart() {

    const income =
        totalIncome();

    const expenses =
        totalExpenses();


    const max =
        Math.max(
            income,
            expenses,
            1
        );


    $("incomeExpenseChart").innerHTML = `

        <div class="chart-row">

            <div class="category-top">

                <span>Income</span>

                <strong>
                    ${money(income)}
                </strong>

            </div>

            <div class="progress">

                <div
                    style="
                        width:${(income / max) * 100}%;
                        background:#18a56b;
                    "
                ></div>

            </div>

        </div>


        <div class="chart-row">

            <div class="category-top">

                <span>Expenses</span>

                <strong>
                    ${money(expenses)}
                </strong>

            </div>

            <div class="progress">

                <div
                    style="
                        width:${(expenses / max) * 100}%;
                        background:#e5484d;
                    "
                ></div>

            </div>

        </div>

    `;

}


/* =========================================================
   BUDGETS
   ========================================================= */

function renderBudgets() {

    const container =
        $("budgetList");


    if (!state.budgets.length) {

        container.innerHTML = `

            <div class="feature-card">

                <h3>No Budgets</h3>

                <p>
                    Create a budget to control
                    category spending.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.budgets.map(
            budget => {

                const spent =
                    totalExpenses(
                        state.transactions.filter(
                            t =>
                                t.category ===
                                budget.category &&
                                isThisMonth(t.date)
                        )
                    );


                const percent =
                    Math.min(
                        100,
                        (spent /
                            Number(budget.amount)) *
                            100
                    );


                return `

                    <div class="feature-card">

                        <h3>
                            ${escapeHtml(
                                budget.category
                            )}
                        </h3>

                        <p>
                            ${money(spent)}
                            /
                            ${money(budget.amount)}
                        </p>

                        <div class="card-progress">

                            <div class="progress">

                                <div
                                    style="width:${percent}%"
                                ></div>

                            </div>

                        </div>

                        <button
                            class="danger-btn"
                            onclick="deleteBudget('${budget.id}')"
                        >
                            Delete
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function deleteBudget(id) {

    state.budgets =
        state.budgets.filter(
            b => b.id !== id
        );

    saveData();

    renderBudgets();

}


/* =========================================================
   GOALS
   ========================================================= */

function renderGoals() {

    const container =
        $("goalList");


    if (!state.goals.length) {

        container.innerHTML = `

            <div class="feature-card">

                <h3>No Savings Goals</h3>

                <p>
                    Create a goal to track your savings.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.goals.map(
            goal => {

                const percent =
                    Math.min(
                        100,
                        (
                            Number(goal.saved) /
                            Number(goal.target)
                        ) * 100
                    );


                return `

                    <div class="feature-card">

                        <h3>
                            🎯
                            ${escapeHtml(goal.name)}
                        </h3>

                        <p>
                            Saved:
                            ${money(goal.saved)}
                            /
                            ${money(goal.target)}
                        </p>

                        <div class="card-progress">

                            <div class="progress">

                                <div
                                    style="width:${percent}%"
                                ></div>

                            </div>

                        </div>

                        <button
                            class="danger-btn"
                            onclick="deleteGoal('${goal.id}')"
                        >
                            Delete
                        </button>

                    </div>

                `;

            }
        ).join("");

}


function deleteGoal(id) {

    state.goals =
        state.goals.filter(
            g => g.id !== id
        );

    saveData();

    renderGoals();

}


/* =========================================================
   RECURRING
   ========================================================= */

function renderRecurring() {

    const container =
        $("recurringList");


    if (!state.recurring.length) {

        container.innerHTML = `

            <div class="feature-card">

                <h3>No Recurring Payments</h3>

                <p>
                    Add rent, subscriptions,
                    fees or other regular payments.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.recurring.map(
            item => `

                <div class="feature-card">

                    <h3>
                        🔄
                        ${escapeHtml(item.name)}
                    </h3>

                    <p>
                        ${money(item.amount)}
                        •
                        ${escapeHtml(item.frequency)}
                    </p>

                    <button
                        class="danger-btn"
                        onclick="deleteRecurring('${item.id}')"
                    >
                        Delete
                    </button>

                </div>

            `
        ).join("");

}


function deleteRecurring(id) {

    state.recurring =
        state.recurring.filter(
            r => r.id !== id
        );

    saveData();

    renderRecurring();

}


/* =========================================================
   CATEGORIES
   ========================================================= */

function renderCategories() {

    const container =
        $("categoryList");


    const totals =
        getCategoryTotals();


    container.innerHTML =
        state.categories.map(
            category => `

                <div class="category-card">

                    <h3>
                        ${escapeHtml(category)}
                    </h3>

                    <p>
                        Total spent:
                        <strong>
                            ${money(
                                totals[category] || 0
                            )}
                        </strong>
                    </p>

                </div>

            `
        ).join("");

}


/* =========================================================
   REPORTS
   ========================================================= */

function renderReports() {

    const transactions =
        [...state.transactions]
            .sort(
                (a, b) =>
                    b.date.localeCompare(
                        a.date
                    )
            );


    $("reportPreview").innerHTML = `

        <div class="summary-cards">

            <div class="summary-card">
                <span>Starting Amount</span>
                <strong>
                    ${money(state.startingBalance)}
                </strong>
            </div>

            <div class="summary-card">
                <span>Total Income</span>
                <strong>
                    ${money(totalIncome())}
                </strong>
            </div>

            <div class="summary-card">
                <span>Total Expenses</span>
                <strong>
                    ${money(totalExpenses())}
                </strong>
            </div>

        </div>


        <div class="transaction-list">

            ${
                transactions
                    .slice(0, 10)
                    .map(transactionHTML)
                    .join("")
            }

        </div>

    `;

}


/* =========================================================
   PDF EXPORT
   ========================================================= */

function exportPDF() {

    if (!window.jspdf) {

        showToast(
            "PDF library is not loaded"
        );

        return;
    }


    const {
        jsPDF
    } = window.jspdf;


    const doc =
        new jsPDF();


    const transactions =
        [...state.transactions]
            .sort(
                (a, b) =>
                    b.date.localeCompare(
                        a.date
                    )
            );


    doc.setFontSize(20);

    doc.text(
        "Rishi Expense Manager",
        14,
        18
    );


    doc.setFontSize(10);

    doc.text(
        "Personal Finance Report",
        14,
        25
    );


    doc.text(
        "Generated: " +
        new Date().toLocaleString(
            "en-IN"
        ),
        14,
        32
    );


    doc.setFontSize(11);


    doc.text(
        "Starting Amount: " +
        money(state.startingBalance),
        14,
        45
    );


    doc.text(
        "Total Income: " +
        money(totalIncome()),
        14,
        52
    );


    doc.text(
        "Total Expenses: " +
        money(totalExpenses()),
        14,
        59
    );


    doc.text(
        "Current Balance: " +
        money(currentBalance()),
        14,
        66
    );


    if (
        typeof doc.autoTable ===
        "function"
    ) {

        doc.autoTable({

            startY: 76,

            head: [[
                "Date",
                "Title",
                "Category",
                "Type",
                "Payment",
                "Amount"
            ]],

            body:
                transactions.map(
                    t => [

                        formatDate(t.date),

                        t.title,

                        t.category,

                        t.type,

                        t.paymentMethod || "",

                        (
                            t.type === "income"
                                ? "+"
                                : "-"
                        ) +
                        money(t.amount)

                    ]
                ),

            styles: {
                fontSize: 8
            },

            headStyles: {
                fillColor: [
                    22,
                    131,
                    255
                ]
            },

            margin: {
                left: 10,
                right: 10
            }

        });

    } else {

        let y = 80;

        transactions.forEach(t => {

            if (y > 280) {

                doc.addPage();

                y = 20;

            }

            doc.text(
                `${formatDate(t.date)} | ${t.title} | ${t.category} | ${money(t.amount)}`,
                12,
                y
            );

            y += 7;

        });

    }


    doc.save(
        "rishi-expense-report.pdf"
    );


    showToast(
        "PDF downloaded"
    );

}


/* =========================================================
   CSV EXPORT
   ========================================================= */

function exportCSV() {

    const rows = [

        [
            "Date",
            "Title",
            "Type",
            "Amount",
            "Category",
            "Payment Method",
            "Note"
        ],

        ...state.transactions.map(
            t => [
                t.date,
                t.title,
                t.type,
                t.amount,
                t.category,
                t.paymentMethod || "",
                t.note || ""
            ]
        )

    ];


    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(value)
                                    .replaceAll(
                                        '"',
                                        '""'
                                    )}"`
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "rishi-expense-report.csv";

    link.click();


    URL.revokeObjectURL(url);

    showToast(
        "CSV downloaded"
    );

}


/* =========================================================
   BACKUP
   ========================================================= */

function backupData() {

    const backup = {

        app:
            "Rishi Expense Manager",

        version:
            3,

        exportedAt:
            new Date().toISOString(),

        data:
            state

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    backup,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "rishi-expense-backup.json";

    link.click();


    URL.revokeObjectURL(url);


    showToast(
        "Backup downloaded"
    );

}


function restoreData(file) {

    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            try {

                const backup =
                    JSON.parse(
                        event.target.result
                    );


                if (
                    !backup.data
                ) {

                    throw new Error(
                        "Invalid backup"
                    );

                }


                state =
                    backup.data;


                saveData();

                populateCategories();

                resetTransactionForm();

                renderDashboard();

                showPage(
                    "dashboard"
                );


                showToast(
                    "Backup restored successfully"
                );


            } catch (error) {

                console.error(error);

                showToast(
                    "Invalid backup file"
                );

            }

        };


    reader.readAsText(file);

}


function clearAllData() {

    if (
        !confirm(
            "Delete ALL expense data? This cannot be undone unless you have a backup."
        )
    ) {

        return;
    }


    localStorage.removeItem(
        STORAGE_KEY
    );


    state = {

        startingBalance: 0,

        transactions: [],

        budgets: [],

        goals: [],

        recurring: [],

        categories: [...defaultCategories],

        settings: {
            currency: "₹",
            darkMode: false
        }

    };


    applyTheme();

    populateCategories();

    resetTransactionForm();

    renderDashboard();

    showPage(
        "dashboard"
    );


    showToast(
        "All data deleted"
    );

}


/* =========================================================
   SIMPLE ADD DIALOGS
   ========================================================= */

function addBudget() {

    const category =
        prompt(
            "Enter category:"
        );

    if (!category) {
        return;
    }


    const amount =
        Number(
            prompt(
                "Enter monthly budget:"
            )
        );


    if (!amount || amount <= 0) {
        return;
    }


    state.budgets.push({

        id:
            Date.now().toString(),

        category,

        amount

    });


    saveData();

    renderBudgets();

    showToast(
        "Budget added"
    );

}


function addGoal() {

    const name =
        prompt(
            "Goal name:"
        );

    if (!name) {
        return;
    }


    const target =
        Number(
            prompt(
                "Target amount:"
            )
        );


    if (!target || target <= 0) {
        return;
    }


    const saved =
        Number(
            prompt(
                "Already saved:"
            ) || 0
        );


    state.goals.push({

        id:
            Date.now().toString(),

        name,

        target,

        saved

    });


    saveData();

    renderGoals();

    showToast(
        "Savings goal added"
    );

}


function addRecurring() {

    const name =
        prompt(
            "Payment name:"
        );

    if (!name) {
        return;
    }


    const amount =
        Number(
            prompt(
                "Amount:"
            )
        );


    if (!amount || amount <= 0) {
        return;
    }


    const frequency =
        prompt(
            "Frequency: Monthly / Weekly / Yearly"
        ) ||
        "Monthly";


    state.recurring.push({

        id:
            Date.now().toString(),

        name,

        amount,

        frequency

    });


    saveData();

    renderRecurring();

    showToast(
        "Recurring payment added"
    );

}


function addCategory() {

    const category =
        prompt(
            "New category name:"
        );


    if (!category) {
        return;
    }


    if (
        state.categories.includes(
            category
        )
    ) {

        showToast(
            "Category already exists"
        );

        return;
    }


    state.categories.push(
        category
    );


    saveData();

    populateCategories();

    renderCategories();

    showToast(
        "Category added"
    );

}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {

    document.body.classList.toggle(
        "dark",
        state.settings.darkMode
    );

}


function toggleDarkMode() {

    state.settings.darkMode =
        !state.settings.darkMode;

    saveData();

    applyTheme();

    showToast(
        state.settings.darkMode
            ? "Dark mode enabled"
            : "Light mode enabled"
    );

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEvents() {


    /* Sidebar */

    $("openSidebar")
        .addEventListener(
            "click",
            () => {
                $("sidebar")
                    .classList.add("open");
            }
        );


    $("closeSidebar")
        .addEventListener(
            "click",
            () => {
                $("sidebar")
                    .classList.remove("open");
            }
        );


    /* Menu */

    document
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    showPage(
                        item.dataset.page
                    );

                }
            );

        });


    /* Page links */

    document.addEventListener(
        "click",
        event => {

            const element =
                event.target.closest(
                    "[data-page-link]"
                );


            if (!element) {
                return;
            }


            showPage(
                element.dataset.pageLink
            );

        }
    );


    /* Add */

    $("quickAdd")
        .addEventListener(
            "click",
            () => {
                resetTransactionForm();
                showPage("add");
            }
        );


    $("dashboardAdd")
        .addEventListener(
            "click",
            () => {
                resetTransactionForm();
                showPage("add");
            }
        );


    /* Transaction form */

    $("transactionForm")
        .addEventListener(
            "submit",
            submitTransaction
        );


    $("cancelEditBtn")
        .addEventListener(
            "click",
            resetTransactionForm
        );


    /* Balance */

    $("editBalanceBtn")
        .addEventListener(
            "click",
            openBalanceModal
        );


    $("closeBalanceModal")
        .addEventListener(
            "click",
            closeBalanceModal
        );


    $("cancelBalance")
        .addEventListener(
            "click",
            closeBalanceModal
        );


    $("saveBalance")
        .addEventListener(
            "click",
            saveBalance
        );


    /* Filters */

    [
        "searchInput",
        "typeFilter",
        "categoryFilter",
        "periodFilter",
        "sortFilter"
    ]
        .forEach(id => {

            $(id).addEventListener(
                "input",
                renderTransactions
            );

            $(id).addEventListener(
                "change",
                renderTransactions
            );

        });


    /* Daily */

    $("dailyDate")
        .addEventListener(
            "change",
            renderDaily
        );


    /* Monthly */

    $("monthlyMonth")
        .addEventListener(
            "change",
            renderMonthly
        );


    /* PDF */

    $("exportPdfBtn")
        .addEventListener(
            "click",
            exportPDF
        );


    $("reportPdfBtn")
        .addEventListener(
            "click",
            exportPDF
        );


    /* CSV */

    $("reportCsvBtn")
        .addEventListener(
            "click",
            exportCSV
        );


    /* Print */

    $("printReportBtn")
        .addEventListener(
            "click",
            () => {
                window.print();
            }
        );


    /* Budget */

    $("addBudgetBtn")
        .addEventListener(
            "click",
            addBudget
        );


    /* Goal */

    $("addGoalBtn")
        .addEventListener(
            "click",
            addGoal
        );


    /* Recurring */

    $("addRecurringBtn")
        .addEventListener(
            "click",
            addRecurring
        );


    /* Category */

    $("addCategoryBtn")
        .addEventListener(
            "click",
            addCategory
        );


    /* Backup */

    $("backupBtn")
        .addEventListener(
            "click",
            backupData
        );


    $("restoreBtn")
        .addEventListener(
            "click",
            () => {
                $("restoreFile").click();
            }
        );


    $("restoreFile")
        .addEventListener(
            "change",
            event => {

                restoreData(
                    event.target.files[0]
                );

                event.target.value = "";

            }
        );


    /* Delete */

    $("clearDataBtn")
        .addEventListener(
            "click",
            clearAllData
        );


    /* Dark */

    $("darkToggle")
        .addEventListener(
            "click",
            toggleDarkMode
        );


    $("settingsDarkBtn")
        .addEventListener(
            "click",
            toggleDarkMode
        );


    /* Currency */

    $("currencySetting")
        .addEventListener(
            "change",
            event => {

                state.settings.currency =
                    event.target.value;

                saveData();

                renderDashboard();

                showToast(
                    "Currency updated"
                );

            }
        );

}


/* =========================================================
   INIT
   ========================================================= */

function init() {

    loadData();

    applyTheme();

    populateCategories();

    $("currencySetting").value =
        state.settings.currency;


    $("date").value =
        todayString();


    $("time").value =
        new Date()
            .toTimeString()
            .slice(0, 5);


    $("dailyDate").value =
        todayString();


    $("monthlyMonth").value =
        currentMonthString();


    setupEvents();

    renderDashboard();

}


document.addEventListener(
    "DOMContentLoaded",
    init
);