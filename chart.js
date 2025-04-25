document.addEventListener("DOMContentLoaded", async () => {
    const email = localStorage.getItem("email"); // assuming you store email after login
    if (!email) {
        console.error("Email not found in localStorage");
        return;
    }

    try {
        const response = await fetch("/transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(email)
        });

        const data = await response.json();

        if (!data.transaction) {
            console.error("No transaction data found");
            return;
        }

        const income = data.transaction.income || 0;
        const expense = data.transaction.expense || 0;
        const balance = data.transaction.balance || 0;

        const ctxPie = document.getElementById("pieChart").getContext("2d");
        new Chart(ctxPie, {
            type: "pie",
            data: {
                labels: ["Income", "Expense"],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ["green", "red"]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: "Income vs Expense (Pie Chart)"
                    }
                }
            }
        });

        const ctxBar = document.getElementById("barChart").getContext("2d");
        new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: ["Income", "Expense"],
                datasets: [{
                    label: "Amount",
                    data: [income, expense],
                    backgroundColor: ["green", "red"]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: "Income vs Expense (Bar Chart)"
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error fetching transaction data:", error);
    }
});
