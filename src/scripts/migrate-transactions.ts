
import { db } from '../src/lib/firebase';
import { ref, get, update } from 'firebase/database';
import type { Transaction } from '@/types';

async function migrateData() {
    console.log("Starting data migration...");
    
    // Migrate Transactions
    const transactionsRef = ref(db, 'transactions');
    try {
        const transactionSnapshot = await get(transactionsRef);
        const transactionData = transactionSnapshot.val();

        if (transactionData) {
            const transactionUpdates: Record<string, any> = {};
            let transactionsMigrated = 0;

            Object.keys(transactionData).forEach(key => {
                const transaction = transactionData[key];
                let needsUpdate = false;
                if (transaction.status === undefined) {
                    transactionUpdates[`/transactions/${key}/status`] = 'completed';
                    needsUpdate = true;
                }
                if (transaction.projectId === undefined) {
                    transactionUpdates[`/transactions/${key}/projectId`] = '-NztBqYtA3So9WwL0d5V'; 
                    needsUpdate = true;
                }
                if (transaction.glCode !== undefined) {
                    transactionUpdates[`/transactions/${key}/glCode`] = null;
                    needsUpdate = true;
                }

                if(needsUpdate) transactionsMigrated++;
            });

            if (transactionsMigrated > 0) {
                console.log(`Found ${transactionsMigrated} transactions to update.`);
                await update(ref(db), transactionUpdates);
                console.log("Successfully updated transactions.");
            } else {
                console.log("All transactions are up to date. No migration needed.");
            }
        } else {
            console.log("No transactions found to migrate.");
        }

    } catch (error) {
        console.error('Error migrating transactions:', error);
    }
    
    // Migrate Employees
    const employeesRef = ref(db, 'employees');
    try {
        const employeeSnapshot = await get(employeesRef);
        const employeeData = employeeSnapshot.val();

        if (employeeData) {
            const employeeUpdates: Record<string, any> = {};
            let employeesMigrated = 0;

            Object.keys(employeeData).forEach(key => {
                const employee = employeeData[key];
                if (employee.employmentType === undefined) {
                    employeeUpdates[`/employees/${key}/employmentType`] = 'permanent';
                    employeesMigrated++;
                }
            });

            if (employeesMigrated > 0) {
                console.log(`Found ${employeesMigrated} employees to update.`);
                await update(ref(db), employeeUpdates);
                console.log("Successfully updated employees with employmentType.");
            } else {
                console.log("All employees are up to date with employmentType. No migration needed.");
            }
        } else {
            console.log("No employees found to migrate.");
        }
    } catch (error) {
        console.error('Error migrating employees:', error);
    }


    console.log("Migration script finished.");
    process.exit(0); // Exit after all migrations
}

migrateData();
