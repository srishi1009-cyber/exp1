const DB_NAME = "RishiExpenseManagerDB";
const DB_VERSION = 1;

const DB_STORES = {
    transactions: "transactions",
    budgets: "budgets",
    goals: "goals",
    recurring: "recurring",
    categories: "categories",
    settings: "settings"
};

const DEFAULT_CATEGORIES = [
    {
        id: "food",
        name: "Food",
        type: "expense",
        icon: "🍔"
    },
    {
        id: "transport",
        name: "Transport",
        type: "expense",
        icon: "🚗"
    },
    {
        id: "shopping",
        name: "Shopping",
        type: "expense",
        icon: "🛍️"
    },
    {
        id: "bills",
        name: "Bills",
        type: "expense",
        icon: "💡"
    },
    {
        id: "education",
        name: "Education",
        type: "expense",
        icon: "📚"
    },
    {
        id: "health",
        name: "Health",
        type: "expense",
        icon: "💊"
    },
    {
        id: "entertainment",
        name: "Entertainment",
        type: "expense",
        icon: "🎮"
    },
    {
        id: "travel",
        name: "Travel",
        type: "expense",
        icon: "✈️"
    },
    {
        id: "salary",
        name: "Salary",
        type: "income",
        icon: "💼"
    },
    {
        id: "freelance",
        name: "Freelance",
        type: "income",
        icon: "💻"
    },
    {
        id: "gift",
        name: "Gift",
        type: "income",
        icon: "🎁"
    },
    {
        id: "other",
        name: "Other",
        type: "both",
        icon: "📦"
    }
];

const DEFAULT_SETTINGS = {
    id: "app",
    userName: "Rishi",
    currency: "₹",
    darkMode: true,
    accent: "blue"
};

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported"));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(DB_STORES.transactions)) {
                const store = db.createObjectStore(
                    DB_STORES.transactions,
                    { keyPath: "id" }
                );

                store.createIndex("date", "date", {
                    unique: false
                });

                store.createIndex("type", "type", {
                    unique: false
                });

                store.createIndex("category", "category", {
                    unique: false
                });
            }

            if (!db.objectStoreNames.contains(DB_STORES.budgets)) {
                const store = db.createObjectStore(
                    DB_STORES.budgets,
                    { keyPath: "id" }
                );

                store.createIndex("category", "category", {
                    unique: false
                });
            }

            if (!db.objectStoreNames.contains(DB_STORES.goals)) {
                const store = db.createObjectStore(
                    DB_STORES.goals,
                    { keyPath: "id" }
                );

                store.createIndex("deadline", "deadline", {
                    unique: false
                });
            }

            if (!db.objectStoreNames.contains(DB_STORES.recurring)) {
                const store = db.createObjectStore(
                    DB_STORES.recurring,
                    { keyPath: "id" }
                );

                store.createIndex("nextDate", "nextDate", {
                    unique: false
                });

                store.createIndex("type", "type", {
                    unique: false
                });
            }

            if (!db.objectStoreNames.contains(DB_STORES.categories)) {
                const store = db.createObjectStore(
                    DB_STORES.categories,
                    { keyPath: "id" }
                );

                store.createIndex("name", "name", {
                    unique: false
                });

                store.createIndex("type", "type", {
                    unique: false
                });
            }

            if (!db.objectStoreNames.contains(DB_STORES.settings)) {
                db.createObjectStore(
                    DB_STORES.settings,
                    { keyPath: "id" }
                );
            }
        };

        request.onsuccess = async event => {
            const db = event.target.result;

            db.onversionchange = () => {
                db.close();
            };

            try {
                await initializeDatabase(db);
                resolve(db);
            } catch (error) {
                reject(error);
            }
        };

        request.onerror = () => {
            reject(
                request.error ||
                new Error("Unable to open database")
            );
        };

        request.onblocked = () => {
            reject(
                new Error("Database upgrade is blocked")
            );
        };
    });
}

async function initializeDatabase(db) {
    const categories = await dbGetAllFromDatabase(
        db,
        DB_STORES.categories
    );

    if (!categories.length) {
        for (const category of DEFAULT_CATEGORIES) {
            await dbPutToDatabase(
                db,
                DB_STORES.categories,
                category
            );
        }
    }

    const settings = await dbGetFromDatabase(
        db,
        DB_STORES.settings,
        "app"
    );

    if (!settings) {
        await dbPutToDatabase(
            db,
            DB_STORES.settings,
            DEFAULT_SETTINGS
        );
    }
}

function dbPutToDatabase(db, storeName, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.put(value);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(
                request.error ||
                new Error("Unable to save data")
            );
        };
    });
}

function dbGetFromDatabase(db, storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);

        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(
                request.error ||
                new Error("Unable to read data")
            );
        };
    });
}

function dbGetAllFromDatabase(db, storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);

        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(
                request.error ||
                new Error("Unable to read data")
            );
        };
    });
}

let databasePromise = null;

function getDatabase() {
    if (!databasePromise) {
        databasePromise = openDatabase();
    }

    return databasePromise;
}

async function dbPut(storeName, value) {
    const db = await getDatabase();

    return dbPutToDatabase(
        db,
        storeName,
        value
    );
}

async function dbGet(storeName, key) {
    const db = await getDatabase();

    return dbGetFromDatabase(
        db,
        storeName,
        key
    );
}

async function dbGetAll(storeName) {
    const db = await getDatabase();

    return dbGetAllFromDatabase(
        db,
        storeName
    );
}

async function dbDelete(storeName, key) {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.delete(key);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(
                request.error ||
                new Error("Unable to delete data")
            );
        };
    });
}

async function dbClear(storeName) {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.clear();

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(
                request.error ||
                new Error("Unable to clear data")
            );
        };
    });
}

async function dbClearAll() {
    const stores = Object.values(DB_STORES);

    for (const storeName of stores) {
        await dbClear(storeName);
    }

    for (const category of DEFAULT_CATEGORIES) {
        await dbPut(
            DB_STORES.categories,
            category
        );
    }

    await dbPut(
        DB_STORES.settings,
        DEFAULT_SETTINGS
    );

    return true;
}

async function dbCount(storeName) {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);

        const request = store.count();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(
                request.error ||
                new Error("Unable to count records")
            );
        };
    });
}

async function dbExists(storeName, key) {
    const value = await dbGet(storeName, key);

    return value !== undefined;
}

async function dbReplaceAll(storeName, values) {
    await dbClear(storeName);

    for (const value of values) {
        await dbPut(storeName, value);
    }

    return true;
}

async function dbExportAll() {
    const result = {};

    for (const storeName of Object.values(DB_STORES)) {
        result[storeName] = await dbGetAll(storeName);
    }

    return result;
}

async function dbImportAll(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid database data");
    }

    const allowedStores = Object.values(DB_STORES);

    for (const storeName of allowedStores) {
        if (Array.isArray(data[storeName])) {
            await dbReplaceAll(
                storeName,
                data[storeName]
            );
        }
    }

    return true;
}

window.ExpenseDB = {
    openDatabase,
    getDatabase,
    dbPut,
    dbGet,
    dbGetAll,
    dbDelete,
    dbClear,
    dbClearAll,
    dbCount,
    dbExists,
    dbReplaceAll,
    dbExportAll,
    dbImportAll,
    DEFAULT_CATEGORIES,
    DEFAULT_SETTINGS,
    DB_STORES
};