document.addEventListener(
  "textlayerrendered",
  function(event) {
    // was this the last page?
    if (event.detail.pageNumber === PDFViewerApplication.page) {
      console.log("Finished rendering, adding ISBN links...");
      findISBNs();
    }
  },
  true
);

const ISBN_TEXT_REGEX = /ISBN/i;
const ISBN_CODE_REGEX = /[\d-]{10,}/i;

function findISBNs() {
  const treeWalker = document.createTreeWalker(
    document.getElementById("viewer"),
    NodeFilter.SHOW_TEXT
  );

  while (treeWalker.nextNode()) {
    let node = treeWalker.currentNode;
    const parentName = node.parentNode.nodeName;
    if (parentName === "SCRIPT" || parentName === "STYLE") {
      continue;
    }
    if (!ISBN_TEXT_REGEX.exec(node.data)) {
      continue;
    }

    // Try and match an ISBN code in next few text nodes, including current
    let match;
    for (let x = 0; x <= 3; x++) {
      match = ISBN_CODE_REGEX.exec(node.data);
      if (match) {
        break;
      }
      treeWalker.nextNode();
      node = treeWalker.currentNode;
    }
    if (!match) {
      continue;
    }

    const isbn = match[0];
    console.log("Found ISBN!", isbn);

    isbnToArchiveID(isbn).then(function(archiveID) {
      if (archiveID) {
        console.log("Found archiveID!", archiveID);
      } else {
        console.log("No archiveID found")
      }
    });
  }
}
