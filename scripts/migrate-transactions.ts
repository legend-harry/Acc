
import { db } from '../src/lib/firebase';
import { ref, get, update } from 'firebase/database';
import type { Transaction } from '@/types';

async function migrateTransactions() {
    console.log("Starting transaction migration...");
    const transactionsRef = ref(db, 'transactions');
    try {
        const snapshot = await get(transactionsRef);
        const data = snapshot.val();

        if (!data) {
            console.log("No transactions found to migrate.");
            return;
        }

        const updates: Record<string, any> = {};
        let transactionsMigrated = 0;

        Object.keys(data).forEach(key => {
            const transaction = data[key];
            // Check if the status field is missing
            if (transaction.status === undefined) {
                updates[`/transactions/${key}/status`] = 'completed';
                transactionsMigrated++;
            }
        });

        if (transactionsMigrated > 0) {
            console.log(`Found ${transactionsMigrated} transactions to update.`);
            await update(ref(db), updates);
            console.log("Successfully updated transactions with 'completed' status.");
        } else {
            console.log("All transactions already have a status. No migration needed.");
        }

    } catch (error) {
        console.error('Error migrating transactions:', error);
        process.exit(1);
    } finally {
        console.log("Migration script finished.");
        // The script hangs without this in some environments.
        process.exit(0);
    }
}

migrateTransactions();
