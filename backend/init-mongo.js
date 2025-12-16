// MongoDB initialization script

const dbName = "platform-cloud";

// Connect to the admin database
const adminDb = db.getSiblingDB("admin");

// Authenticate as admin
adminDb.auth("admin", "password");

// Create the platform-cloud database
const platformCloudDb = db.getSiblingDB(dbName);

// Optionally, you can create collections or indexes here
// platformCloudDb.createCollection("exampleCollection");

print(`Database '${dbName}' initialized successfully.`);