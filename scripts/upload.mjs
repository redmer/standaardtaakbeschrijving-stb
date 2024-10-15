import App from "@triply/triplydb";

// Get the TriplyDB application and require its TriplyDB token
const TriplyDB = App.get({ token: process.env.TRIPLYDB_TOKEN });
const info1 = await TriplyDB.getInfo();
const baseUrl = info1.consoleUrl;
console.log(`INFO: TriplyDB instance at ${baseUrl}`);

// Get the dataset to upload to
const accountName = process.env.TRIPLYDB_USERNAME;
const datasetName = process.env.TRIPLYDB_DATASET;
const account = await TriplyDB.getAccount(accountName);
const dataset = await account.ensureDataset(datasetName, {
  accessLevel: "public",
});
const datasetUrl = `${info1.consoleUrl}/${accountName}/${datasetName}`;
console.log(`INFO: Uploading...`);

// Upload the dataset with the magic name
const DATASET_FN = "data/transformed.nq";

await dataset.importFromFiles([DATASET_FN], {
  overwriteAll: true,
});

console.log(`DONE: See dataset at <${datasetUrl}>`);
