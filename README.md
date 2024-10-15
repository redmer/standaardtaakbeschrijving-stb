# standaardtaakbeschrijving-stb

Standaardtaakbeschrijving (STB) is een handige tool om de inhoud van de opdracht te omschrijven

# Usage

1. Download the `STB_1_mei_2014.xls` file and put it in `data/STB_1_mei_2014.xls`
2. To build, run on the CLI `npm run build`.
3. To publish to TriplyDB, set the right token and username/dataset settings in `.env`. [An example file is provided.](.env.example).

# Contents

The scripts in [/scripts](/scripts/) load the Excel file, transform it to RDF and upload it.
The ontology in [/ontology](/ontology/) described the STB ontology in relation to NEN 2660-2.
The N3 file there describes the RDFS inference rules.

# Dependencies

- `@triply/triplydb`: upload and publish the dataset
- `eyereasoner`: reason (RDFS) about the dataset and ontology
- `n3`: general RDF tools
- `node-xlsx`: general Excel file reader.
