# ExpenseWise: Your Personal Finance Companion

ExpenseWise is a modern, intuitive, and powerful web application designed to help you take control of your finances. Built with Next.js, React, and Firebase, it provides a seamless and responsive experience for tracking expenses, managing budgets, and gaining valuable insights into your spending habits.

## Core Features

### 1. Interactive Dashboard
The dashboard is your financial command center, offering a comprehensive at-a-glance overview of your financial health.

*   **Summary Cards**: Key metrics are displayed prominently:
    *   **Total Spending**: A sum of all completed and credit-based expenses.
    *   **Credit Due**: The total amount of unpaid expenses, highlighted for immediate attention.
    *   **Expected Transactions**: The sum of all planned future expenses.
    *   **Last Expense**: Details of your most recent transaction.
    *   **Completed Txns**: A count of all completed transactions.
*   **Clickable Tiles**: The "Total Spending," "Credit Due," and "Expected" cards are interactive, redirecting you to a pre-filtered list of the corresponding transactions.
*   **Actionable Reminders**: Dedicated sections for "Credit Reminders" and "Expected Transactions" appear on the dashboard when such items exist, providing direct links to manage them.
*   **Data Visualization**:
    *   **Planned vs. Actual Spending**: A bar chart comparing your budgeted amounts against your actual spending for each category.
    *   **Monthly Overview**: A bar chart that visualizes your spending trends over the past few months.
    *   **Spending by Category**: An interactive pie chart that breaks down your expenses by category, showing the percentage and total amount for each slice.

### 2. Comprehensive Transaction Management
The "Transactions" page provides a detailed and powerful interface for managing all your financial activities.

*   **Add/Edit/Delete**: Easily add, update, or remove transactions through user-friendly dialogs. Deleting a transaction requires confirmation to prevent accidental data loss.
*   **Expense Statuses**: Assign a status to each expense:
    *   `Completed`: The transaction is paid and finished.
    *   `Credit`: The expense has been incurred but not yet paid.
    *   `Expected`: A planned future expense.
*   **Transaction Types**: Log both `Expense` and `Income` to get a complete financial picture.
*   **Detailed Entry**: Each transaction can store rich information, including a title, amount, date, category, vendor, description, notes, quantity, unit, and invoice number.
*   **Receipt Uploads**: Attach a photo of your receipt to any transaction for easy record-keeping.
*   **Advanced Filtering & Sorting**:
    *   Search by title, vendor, or description.
    *   Filter by category, transaction type, or status.
    *   Filter by a specific date using a calendar picker.
    *   Sort transactions by the date they were added or the date of the expense.
*   **Floating Sum**: A sleek, interactive floating circle at the bottom-right of the screen displays the net sum of all currently filtered transactions. It expands on click to show the total.
*   **Responsive View**: The layout adapts seamlessly from a detailed table on desktop to a user-friendly card view on mobile devices.

### 3. Dynamic Financial Planner
The "Planner" page (formerly Budgets) is where you manage your spending categories and financial goals.

*   **Category Management**:
    *   **Add**: Create new spending categories on the fly.
    *   **Delete**: Remove categories you no longer need with a confirmation step.
*   **Budget Setting**: Assign a monthly budget to any category. These budgets are then used in the "Planned vs. Actual Spending" chart on the dashboard.
*   **Real-time Updates**: Any changes made in the Planner—new categories, updated budgets—are instantly reflected across the entire application, including transaction forms and reports.

### 4. Insightful Reports
The "Reports" page allows you to generate and view summaries of your financial data.

*   **Monthly Summaries**: View a list of months, each showing the total spending and transaction count.
*   **Detailed Monthly Reports**: Click on any month to see a detailed report page that includes:
    *   A "Planned vs. Actual" spending chart for that specific month.
    *   A monthly overview chart and a category pie chart.
    *   A complete, color-coded list of all transactions from that month.
*   **PDF Export**: Download a professional PDF summary for any month, which includes all transactions and AI-generated insights.
*   **CSV Export**: Export all your transaction data to a CSV file for use in other applications like Excel or Google Sheets.

### 5. AI-Powered Insights
Leverage the power of AI to get a deeper understanding of your finances.

*   **Generate Insights**: On the Dashboard or any monthly report page, click the "Generate Insights" button.
*   **Spending Analysis**: The AI analyzes your transaction data to identify spending patterns, highlight unusual entries, and suggest potential areas for savings.

## User Interface (UI) and User Experience (UX)

*   **Modern & Clean Design**: The app uses a professional and aesthetically pleasing design system based on **ShadCN UI** components and **Tailwind CSS**.
*   **Responsive Layout**: The entire application is fully responsive and optimized for both desktop and mobile devices, ensuring a great user experience on any screen size.
*   **User Profile System**:
    *   Switch between different user profiles (e.g., "Ammu", "Vijay").
    *   A profile selection dialog appears once per session to ensure the correct user is active.
*   **Intuitive Navigation**: A clear and consistent header with navigation links to all major sections. The mobile view features a slide-out menu for easy access.
*   **Color-Coded Categories**: Transactions and charts use a consistent, algorithmically generated color-coding system for categories, making it easy to visually associate data points.
*   **Interactive Elements**: Hover effects, smooth animations, and clear visual cues are used throughout the app to indicate interactivity.
*   **Toasts & Notifications**: Non-intrusive "toast" notifications provide feedback for actions like adding or deleting transactions.

## Getting Started

This is a Next.js project bootstrapped with `create-next-app`.

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
