function getCanvasContext(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, rect.width * ratio);
    canvas.height = Math.max(1, rect.height * ratio);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    return {
        canvas,
        ctx,
        width: rect.width,
        height: rect.height
    };
}

function getChartColors() {
    const styles = getComputedStyle(document.documentElement);

    return {
        primary: styles.getPropertyValue("--primary").trim() || "#1683ff",
        success: styles.getPropertyValue("--success").trim() || "#22c55e",
        danger: styles.getPropertyValue("--danger").trim() || "#ef4444",
        warning: styles.getPropertyValue("--warning").trim() || "#f59e0b",
        text: styles.getPropertyValue("--text").trim() || "#e8eef7",
        muted: styles.getPropertyValue("--muted").trim() || "#8b9bb0",
        border: styles.getPropertyValue("--border").trim() || "#263447",
        surface: styles.getPropertyValue("--surface").trim() || "#111c2d"
    };
}

function clearCanvas(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
}

function drawEmptyChart(id, message = "No data available") {
    const chart = getCanvasContext(id);
    if (!chart) return;

    const { ctx, width, height } = chart;
    const colors = getChartColors();

    clearCanvas(ctx, width, height);

    ctx.fillStyle = colors.muted;
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, width / 2, height / 2);
}

function drawGrid(ctx, width, height, padding, maxValue) {
    const colors = getChartColors();

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = padding.top +
            ((height - padding.top - padding.bottom) / 4) * i;

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const value = maxValue - (maxValue / 4) * i;

        ctx.fillStyle = colors.muted;
        ctx.font = "11px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        ctx.fillText(
            currency(value),
            padding.left - 8,
            y
        );
    }
}

function drawBarChart(id, labels, values, options = {}) {
    const chart = getCanvasContext(id);
    if (!chart) return;

    const { ctx, width, height } = chart;
    const colors = getChartColors();

    clearCanvas(ctx, width, height);

    if (!values.length || values.every(value => value === 0)) {
        drawEmptyChart(id);
        return;
    }

    const padding = {
        top: 25,
        right: 20,
        bottom: 45,
        left: 70
    };

    const maxValue = Math.max(...values, 1);
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    drawGrid(
        ctx,
        width,
        height,
        padding,
        maxValue
    );

    const gap = 14;
    const barWidth = Math.max(
        8,
        (chartWidth - gap * (values.length - 1)) / values.length
    );

    values.forEach((value, index) => {
        const x = padding.left +
            index * (barWidth + gap);

        const barHeight =
            (value / maxValue) * chartHeight;

        const y =
            padding.top +
            chartHeight -
            barHeight;

        ctx.fillStyle =
            options.color ||
            colors.primary;

        ctx.beginPath();

        if (ctx.roundRect) {
            ctx.roundRect(
                x,
                y,
                barWidth,
                barHeight,
                7
            );
        } else {
            ctx.rect(
                x,
                y,
                barWidth,
                barHeight
            );
        }

        ctx.fill();

        ctx.fillStyle = colors.text;
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        if (value > 0) {
            ctx.fillText(
                currency(value),
                x + barWidth / 2,
                y - 5
            );
        }

        ctx.fillStyle = colors.muted;
        ctx.textBaseline = "top";

        let label = String(labels[index]);

        if (label.length > 10) {
            label = label.substring(0, 9) + "…";
        }

        ctx.fillText(
            label,
            x + barWidth / 2,
            height - padding.bottom + 12
        );
    });
}

function drawLineChart(id, labels, datasets, options = {}) {
    const chart = getCanvasContext(id);
    if (!chart) return;

    const { ctx, width, height } = chart;
    const colors = getChartColors();

    clearCanvas(ctx, width, height);

    const validDatasets = datasets.filter(
        dataset =>
            dataset &&
            Array.isArray(dataset.values) &&
            dataset.values.length
    );

    if (!validDatasets.length) {
        drawEmptyChart(id);
        return;
    }

    const allValues = validDatasets.flatMap(
        dataset => dataset.values
    );

    const maxValue = Math.max(...allValues, 1);

    const padding = {
        top: 25,
        right: 25,
        bottom: 45,
        left: 70
    };

    const chartWidth =
        width - padding.left - padding.right;

    const chartHeight =
        height - padding.top - padding.bottom;

    drawGrid(
        ctx,
        width,
        height,
        padding,
        maxValue
    );

    const defaultColors = [
        colors.primary,
        colors.success,
        colors.danger,
        colors.warning
    ];

    validDatasets.forEach(
        (dataset, datasetIndex) => {
            const values = dataset.values;

            const lineColor =
                dataset.color ||
                defaultColors[
                    datasetIndex %
                    defaultColors.length
                ];

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 3;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            ctx.beginPath();

            values.forEach((value, index) => {
                const x =
                    padding.left +
                    (index /
                        Math.max(values.length - 1, 1)) *
                    chartWidth;

                const y =
                    padding.top +
                    chartHeight -
                    (value / maxValue) *
                    chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            values.forEach((value, index) => {
                const x =
                    padding.left +
                    (index /
                        Math.max(values.length - 1, 1)) *
                    chartWidth;

                const y =
                    padding.top +
                    chartHeight -
                    (value / maxValue) *
                    chartHeight;

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);

                ctx.fillStyle = lineColor;
                ctx.fill();

                ctx.strokeStyle = colors.surface;
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }
    );

    const labels = options.labels || [];

    labels.forEach((label, index) => {
        const x =
            padding.left +
            (index /
                Math.max(labels.length - 1, 1)) *
            chartWidth;

        ctx.fillStyle = colors.muted;
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        ctx.fillText(
            String(label),
            x,
            height - padding.bottom + 12
        );
    });
}

function drawDonutChart(id, labels, values) {
    const chart = getCanvasContext(id);
    if (!chart) return;

    const { ctx, width, height } = chart;
    const colors = getChartColors();

    clearCanvas(ctx, width, height);

    const valid = values
        .map((value, index) => ({
            label: labels[index],
            value: Number(value) || 0
        }))
        .filter(item => item.value > 0);

    if (!valid.length) {
        drawEmptyChart(id);
        return;
    }

    const total = valid.reduce(
        (sum, item) => sum + item.value,
        0
    );

    const chartColors = [
        colors.primary,
        colors.success,
        colors.warning,
        colors.danger,
        "#8b5cf6",
        "#06b6d4",
        "#ec4899",
        "#84cc16",
        "#f97316",
        "#14b8a6"
    ];

    const centerX = width / 2;
    const centerY = height / 2;
    const radius =
        Math.min(width, height) * 0.34;

    let startAngle = -Math.PI / 2;

    valid.forEach((item, index) => {
        const slice =
            (item.value / total) *
            Math.PI * 2;

        const endAngle =
            startAngle + slice;

        ctx.beginPath();

        ctx.moveTo(centerX, centerY);

        ctx.arc(
            centerX,
            centerY,
            radius,
            startAngle,
            endAngle
        );

        ctx.closePath();

        ctx.fillStyle =
            chartColors[
                index % chartColors.length
            ];

        ctx.fill();

        startAngle = endAngle;
    });

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius * 0.58,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = colors.surface;
    ctx.fill();

    ctx.fillStyle = colors.text;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        currency(total),
        centerX,
        centerY
    );
}

function getMonthlyData(transactions, year) {
    const income = Array(12).fill(0);
    const expense = Array(12).fill(0);

    transactions.forEach(transaction => {
        const date = new Date(
            transaction.date + "T00:00:00"
        );

        if (date.getFullYear() !== year) return;

        const month = date.getMonth();
        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "income") {
            income[month] += amount;
        }

        if (transaction.type === "expense") {
            expense[month] += amount;
        }
    });

    return {
        income,
        expense
    };
}

function getCategoryData(transactions) {
    const categoryTotals = {};

    transactions.forEach(transaction => {
        if (transaction.type !== "expense") {
            return;
        }

        const category =
            getCategory(transaction.category);

        const name =
            category?.name ||
            transaction.category ||
            "Other";

        const amount =
            Number(transaction.amount) || 0;

        categoryTotals[name] =
            (categoryTotals[name] || 0) +
            amount;
    });

    const entries =
        Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1]);

    return {
        labels: entries.map(item => item[0]),
        values: entries.map(item => item[1])
    };
}

function renderDashboardCashFlow() {
    const transactions =
        appState.transactions || [];

    const selectedRange =
        document.getElementById(
            "cashFlowRange"
        )?.value || "6";

    const months =
        Math.max(
            1,
            Number(selectedRange)
        );

    const labels = [];
    const income = [];
    const expense = [];

    const now = new Date();

    for (
        let i = months - 1;
        i >= 0;
        i--
    ) {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
        );

        const key =
            date.getFullYear() +
            "-" +
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const monthTransactions =
            transactions.filter(
                transaction =>
                    monthKey(
                        transaction.date
                    ) === key
            );

        let monthIncome = 0;
        let monthExpense = 0;

        monthTransactions.forEach(
            transaction => {
                const amount =
                    Number(transaction.amount) || 0;

                if (
                    transaction.type ===
                    "income"
                ) {
                    monthIncome += amount;
                }

                if (
                    transaction.type ===
                    "expense"
                ) {
                    monthExpense += amount;
                }
            }
        );

        labels.push(
            date.toLocaleDateString(
                "en-IN",
                {
                    month: "short"
                }
            )
        );

        income.push(monthIncome);
        expense.push(monthExpense);
    }

    drawLineChart(
        "cashFlowChart",
        labels,
        [
            {
                name: "Income",
                values: income
            },
            {
                name: "Expenses",
                values: expense
            }
        ],
        {
            labels
        }
    );
}

function renderDashboardCategoryChart() {
    const data =
        getCategoryData(
            appState.transactions || []
        );

    drawDonutChart(
        "categoryChart",
        data.labels,
        data.values
    );

    const legend =
        document.getElementById(
            "categoryLegend"
        );

    if (!legend) return;

    if (!data.labels.length) {
        legend.innerHTML =
            "<span>No expense data yet</span>";
        return;
    }

    const colors = [
        "#1683ff",
        "#22c55e",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#ec4899",
        "#84cc16",
        "#f97316",
        "#14b8a6"
    ];

    legend.innerHTML =
        data.labels
            .slice(0, 10)
            .map(
                (label, index) => `
                    <div class="legend-item">
                        <span
                            class="legend-dot"
                            style="background:${colors[index % colors.length]}"
                        ></span>
                        <span>${escapeHTML(label)}</span>
                    </div>
                `
            )
            .join("");
}

function renderAnnualChart() {
    const year =
        Number(
            document.getElementById(
                "analyticsYear"
            )?.value
        ) ||
        new Date().getFullYear();

    const data =
        getMonthlyData(
            appState.transactions || [],
            year
        );

    const labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    drawLineChart(
        "annualChart",
        labels,
        [
            {
                name: "Income",
                values: data.income
            },
            {
                name: "Expenses",
                values: data.expense
            }
        ],
        {
            labels
        }
    );
}

function renderAnnualCategoryChart() {
    const year =
        Number(
            document.getElementById(
                "analyticsYear"
            )?.value
        ) ||
        new Date().getFullYear();

    const transactions =
        (appState.transactions || [])
            .filter(transaction => {
                const date = new Date(
                    transaction.date +
                    "T00:00:00"
                );

                return (
                    date.getFullYear() ===
                    year
                );
            });

    const data =
        getCategoryData(transactions);

    drawDonutChart(
        "annualCategoryChart",
        data.labels,
        data.values
    );
}

function renderCharts() {
    renderDashboardCashFlow();
    renderDashboardCategoryChart();
    renderAnnualChart();
    renderAnnualCategoryChart();
}

window.addEventListener(
    "resize",
    () => {
        clearTimeout(
            window.chartResizeTimer
        );

        window.chartResizeTimer =
            setTimeout(() => {
                renderCharts();
            }, 150);
    }
);

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const range =
            document.getElementById(
                "cashFlowRange"
            );

        if (range) {
            range.addEventListener(
                "change",
                renderDashboardCashFlow
            );
        }

        const year =
            document.getElementById(
                "analyticsYear"
            );

        if (year) {
            year.addEventListener(
                "change",
                () => {
                    renderAnnualChart();
                    renderAnnualCategoryChart();
                }
            );
        }
    }
);