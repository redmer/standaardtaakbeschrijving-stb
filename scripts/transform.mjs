import { n3reasoner } from "eyereasoner";
import { DataFactory, Parser, Store, StreamWriter } from "n3";
import xlsx from "node-xlsx";
import fs from "node:fs";

const { literal, namedNode, quad } = DataFactory;

const DATASET_FN = "data/transformed.nq";
const SOURCE_FN = "data/STB_1_mei_2014.xls";

function parseRow(/** @type {any[]}  */ row) {
  return {
    code: row[0] ?? undefined,
    taaknr: row[1] ?? undefined,
    taakomschrijving: row[2] ?? undefined,
    fasenr: row[3] ?? undefined,
    faseomschrijving: row[4] ?? undefined,
    themanr: row[5] ?? undefined,
    themaomschrijving: row[6] ?? undefined,
    noodzaak: row[7] ?? undefined,
    volgorde_in_thema: row[8] ?? undefined,
    volgorde_in_cluster: row[9] ?? undefined,
    taakcluster: row[10] ?? undefined,
    onderdeel_van_taakcluster: row[11] ?? undefined,
    Mtaak: row[12] ?? undefined,
    opm: row[13] ?? undefined,
    activiteitnr: row[14] ?? undefined,
    activiteitvolgorde: row[15] ?? undefined,
    tblActiviteiten_omschr: row[16] ?? undefined,
    documentnr: row[17] ?? undefined,
    documentomschrijving: row[18] ?? undefined,
    documenttype: row[19] ?? undefined,
    documentsoort: row[20] ?? undefined,
    documentinhoud: row[21] ?? undefined,
  };
}

const STB = (suffix) =>
  namedNode(`urn:standaardtaakbeschrijving:def/${suffix}`);
const STBID = (suffix) =>
  namedNode(`urn:standaardtaakbeschrijving:id/${suffix}`);
const XSD = (suffix) => namedNode(`http://www.w3.org/2001/XMLSchema#${suffix}`);
const NEN2660 = (suffix) => namedNode(`https://w3id.org/nen2660/def#${suffix}`);
const RDF = (suffix) =>
  namedNode(`http://www.w3.org/1999/02/22-rdf-syntax-ns#${suffix}`);

function* processRows() {
  const workbook = xlsx.parse(SOURCE_FN, { sheets: ["STB april 2014"] });
  for (const sheet of workbook) {
    for (const rawRow of sheet.data) {
      const row = parseRow(rawRow);
      if (row.code == "code") continue;

      const taak = STBID("taak/" + row.taaknr);
      const fase = STBID("fase/" + row.fasenr);
      const thema = STBID("thema/" + row.themanr);
      const activiteit = STBID("act/" + row.activiteitnr);
      const document = STBID("doc/" + row.documentnr);

      // Taak
      yield quad(taak, STB("code"), literal(row.code));
      yield quad(taak, STB("taaknr"), literal(row.taaknr, XSD("string")));
      yield quad(taak, RDF("type"), STB("Taak")); // rdf:type
      yield quad(
        taak,
        STB("taakomschrijving"),
        literal(row.taakomschrijving, "nl")
      );
      if (row.noodzaak == "N")
        yield quad(taak, STB("noodzaak"), literal(true, XSD("boolean")));
      if (row.volgorde_in_thema)
        yield quad(
          taak,
          STB("volgorde_in_thema"),
          literal(row.volgorde_in_thema)
        );
      if (row.volgorde_in_cluster)
        yield quad(
          taak,
          STB("volgorde_in_cluster"),
          literal(row.volgorde_in_cluster)
        );
      if (row.onderdeel_van_taakcluster)
        yield quad(
          taak,
          STB("onderdeel_van_taakcluster"),
          STBID("taak/" + row.onderdeel_van_taakcluster)
        );
      if (row.noodzaak == "M")
        yield quad(taak, STB("mtaak"), literal(true, XSD("boolean")));
      if (row.opm) yield quad(taak, STB("opm"), literal(row.opm, "nl"));

      // Fase
      yield quad(taak, STB("fase"), fase);
      yield quad(fase, RDF("type"), STB("Fase")); // rdf:type
      yield quad(fase, STB("fasenr"), literal(row.fasenr, XSD("string")));
      yield quad(
        fase,
        STB("faseomschrijving"),
        literal(row.faseomschrijving, "nl")
      );

      // Thema
      yield quad(taak, STB("thema"), thema);
      yield quad(thema, RDF("type"), STB("Thema")); // rdf:type
      yield quad(thema, STB("themanr"), literal(row.themanr, XSD("string")));
      yield quad(
        thema,
        STB("themaomschrijving"),
        literal(row.themaomschrijving)
      );
      yield quad(fase, NEN2660("hasPart"), thema);
      yield quad(thema, NEN2660("hasPart"), taak);

      // Activiteit
      yield quad(taak, STB("activiteit"), activiteit);
      yield quad(activiteit, RDF("type"), STB("Activiteit")); // rdf:type
      yield quad(
        activiteit,
        STB("activiteitnr"),
        literal(row.activiteitnr, XSD("string"))
      );
      yield quad(
        activiteit,
        STB("activiteitvolgorde"),
        literal(row.activiteitvolgorde)
      );
      yield quad(
        activiteit,
        STB("tblActiviteiten_omschr"),
        literal(row.tblActiviteiten_omschr, "nl")
      );

      // Document
      if (row.documentnr) {
        yield quad(taak, STB("document"), document);
        yield quad(document, RDF("type"), STB("Document")); // rdf:type
        yield quad(
          document,
          STB("documentnr"),
          literal(row.documentnr, XSD("string"))
        );
        yield quad(
          document,
          STB("documentomschrijving"),
          literal(row.documentomschrijving, "nl")
        );
        yield quad(document, STB("documenttype"), literal(row.documenttype));
        if (row.documentsoort)
          yield quad(
            document,
            STB("documentsoort"),
            literal(row.documentsoort)
          );
        if (row.documentinhoud)
          yield quad(
            document,
            STB("documentinhoud"),
            literal(row.documentinhoud)
          );
      }
    }
  }
}

async function* reason(/** @type {Store} */ store) {
  const rdfsRuleset = new Store(
    new Parser({ format: "n3" }).parse(
      fs.readFileSync("ontology/rdfs.n3", { encoding: "utf-8" })
    )
  );

  const inferred = await n3reasoner(store.getQuads(), rdfsRuleset.getQuads(), {
    outputType: "quads",
  });
  for (const q of inferred) {
    yield quad(q.subject, q.predicate, q.object, namedNode("urn:inferred"));
  }
}

async function main() {
  const store = new Store();
  for (const q of processRows()) store.add(q);

  const preExpansion = store.countQuads();
  console.log(`Raw: # quads:`, preExpansion);

  // Add ontology
  store.addQuads(
    new Parser({ format: "text/turtle" }).parse(
      fs.readFileSync("ontology/stb.ttl", { encoding: "utf-8" })
    )
  );

  for await (const q of reason(store)) store.add(q);
  const postExpansion = store.countQuads();
  console.log(`With reasoning: # quads:`, postExpansion);
  console.log(`Expansion ratio: ${(postExpansion / preExpansion).toFixed(2)}×`);

  const out = fs.createWriteStream(DATASET_FN, { encoding: "utf-8" });
  const writeStream = new StreamWriter({ format: "application/n-quads" });
  const quadStream = store.match();
  quadStream.pipe(writeStream, { end: false }).pipe(out);
}

void main();
