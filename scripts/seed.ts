
import { db } from '../src/lib/firebase';
import { ref, set } from 'firebase/database';

const transactions = [
    {
        "id": "1",
        "date": "2024-05-01T10:00:00.000Z",
        "createdAt": "2024-05-01T10:00:00.000Z",
        "invoiceNo": "INV-001",
        "glCode": "5001",
        "title": "Office Supplies",
        "amount": 1500,
        "quantity": 1,
        "unit": "lot",
        "ratePerUnit": 1500,
        "vendor": "Staples",
        "description": "Purchase of pens, paper, and other office supplies.",
        "notes": "Urgent purchase for new hires.",
        "category": "Miscellaneous Expenses",
        "receiptUrl": ""
    },
    {
        "id": "2",
        "date": "2024-05-02T11:30:00.000Z",
        "createdAt": "2024-05-02T11:30:00.000Z",
        "invoiceNo": "INV-002",
        "glCode": "5013",
        "title": "Contractor Payment",
        "amount": 25200,
        "quantity": 1,
        "unit": "service",
        "ratePerUnit": 25200,
        "vendor": "BuildIt Construction",
        "description": "Payment for April construction labor.",
        "notes": "",
        "category": "Labour"
    },
    {
        "id": "3",
        "date": "2024-05-05T14:00:00.000Z",
        "createdAt": "2024-05-05T14:00:00.000Z",
        "invoiceNo": "INV-003",
        "glCode": "5014",
        "title": "New Laptops",
        "amount": 9500,
        "quantity": 2,
        "unit": "each",
        "ratePerUnit": 4750,
        "vendor": "Dell",
        "description": "Two new laptops for the design team.",
        "notes": "Model: XPS 15",
        "category": "IT Setup"
    },
     {
        "id": "4",
        "date": "2024-05-10T09:00:00.000Z",
        "createdAt": "2024-05-10T09:00:00.000Z",
        "invoiceNo": "INV-004",
        "glCode": "5002",
        "title": "Borewell Drilling",
        "amount": 218800,
        "quantity": 1,
        "unit": "project",
        "ratePerUnit": 218800,
        "vendor": "Aqua Drillers",
        "description": "New borewell construction for water supply.",
        "notes": "Reached 500ft depth.",
        "category": "Bore Construction"
    },
    {
        "id": "5",
        "date": "2024-05-12T16:20:00.000Z",
        "createdAt": "2024-05-12T16:20:00.000Z",
        "invoiceNo": "INV-005",
        "glCode": "5012",
        "title": "Tree Removal",
        "amount": 6500,
        "quantity": 1,
        "unit": "service",
        "ratePerUnit": 6500,
        "vendor": "GreenScape",
        "description": "Removal of dead trees near the main building.",
        "notes": "",
        "category": "Tree Cutting"
    }
];

const budgets = [
    { "id": "1", "glCode": "5001", "category": "Miscellaneous Expenses", "budget": 100000 },
    { "id": "2", "glCode": "5002", "category": "Bore Construction", "budget": 60000 },
    { "id": "3", "glCode": "5003", "category": "Road Work", "budget": 0 },
    { "id": "4", "glCode": "5004", "category": "Weed Removal", "budget": 0 },
    { "id": "5", "glCode": "5005", "category": "LT Connection (Power)", "budget": 500000 },
    { "id": "6", "glCode": "5006", "category": "Electrical Equipments", "budget": 100000 },
    { "id": "7", "glCode": "5007", "category": "Pond Preparation", "budget": 0 },
    { "id": "8", "glCode": "5008", "category": "Seed", "budget": 0 },
    { "id": "9", "glCode": "5009", "category": "Feed", "budget": 0 },
    { "id": "10", "glCode": "5010", "category": "Transportation", "budget": 0 },
    { "id": "11", "glCode": "5011", "category": "Lab and Testing", "budget": 0 },
    { "id": "12", "glCode": "5012", "category": "Tree Cutting", "budget": 5000 },
    { "id": "13", "glCode": "5013", "category": "Labour", "budget": 0 },
    { "id": "14", "glCode": "5014", "category": "IT Setup", "budget": 8000 }
];

async function seedDatabase() {
    try {
        const transactionsRef = ref(db, 'transactions');
        const transactionsData: Record<string, any> = {};
        transactions.forEach(t => {
            const { id, ...rest } = t;
            transactionsData[id] = rest;
        });
        await set(transactionsRef, transactionsData);
        console.log('Transactions seeded successfully.');

        const budgetsRef = ref(db, 'budgets');
        const budgetsData: Record<string, any> = {};
        budgets.forEach(b => {
            const { id, ...rest } = b;
            budgetsData[id] = rest;
        });
        await set(budgetsRef, budgetsData);
        console.log('Budgets seeded successfully.');

    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

seedDatabase();
